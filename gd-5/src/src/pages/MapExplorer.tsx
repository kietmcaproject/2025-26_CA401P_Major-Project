import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Lock, Sparkles, Loader2 } from "lucide-react";

// Forces the map to recalculate its size after mount — fixes blank/grey tiles
const InvalidateOnMount = () => {
  const map = useMap();
  useEffect(() => {
    const timers = [50, 200, 500, 1000].map((d) => setTimeout(() => map.invalidateSize(), d));
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);
  return null;
};

// Fix default marker icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const lockedIcon = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;border-radius:50%;background:hsl(var(--black));display:flex;align-items:center;justify-content:center;color:white;font-size:18px;box-shadow:0 0 0 6px hsla(0,0%,100%,0.5),0 0 20px hsla(184,70%,42%,0.6);" class="glow-marker">🔒</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const revealedIcon = L.divIcon({
  className: "",
  html: `<div style="width:40px;height:40px;border-radius:50%;background:hsl(var(--accent));display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 0 6px hsla(0,0%,100%,0.6),0 0 24px hsla(45,95%,58%,0.7);">✨</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

interface Secret {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  lat?: number;
  lng?: number;
}

// Fallback random coords for secrets without lat/lng (just for visualization)
const seedCoords = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const lat = ((h % 1400) / 10) - 60;
  const lng = (((h >> 8) % 3400) / 10) - 170;
  return [lat, lng] as [number, number];
};

const MapExplorer = () => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("local_secrets" as any)
        .select("id,title,description,location,category")
        .limit(200);
      setSecrets((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const reveal = (id: string) => setRevealed((r) => new Set(r).add(id));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="h-[52px]" />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <Badge className="bg-accent text-accent-foreground mb-3">🗺️ Explore Map</Badge>
          <h1 className="text-3xl md:text-4xl font-black text-foreground">Hidden Gems Around the World</h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-xl mx-auto">
            Click a locked marker to unlock a community-shared local secret. Each pin is an offbeat spot from a real traveller.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-black" /></div>
        ) : (
          <Card className="overflow-hidden rounded-2xl shadow-card border-border">
            <CardContent className="p-0">
              <div style={{ height: "70vh", width: "100%" }}>
                <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }} worldCopyJump scrollWheelZoom>
                  <InvalidateOnMount />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />
                  {secrets.map((s) => {
                    const [lat, lng] = s.lat && s.lng ? [s.lat, s.lng] : seedCoords(s.id);
                    const isRevealed = revealed.has(s.id);
                    return (
                      <Marker
                        key={s.id}
                        position={[lat, lng]}
                        icon={isRevealed ? revealedIcon : lockedIcon}
                        eventHandlers={{ click: () => reveal(s.id) }}
                      >
                        <Popup>
                          {isRevealed ? (
                            <div className="space-y-1 min-w-[200px]">
                              <p className="text-xs uppercase tracking-wider text-black font-bold">{s.category.replace("_", " ")}</p>
                              <p className="font-bold text-sm">{s.title}</p>
                              <p className="text-xs text-muted-foreground">{s.location}</p>
                              <p className="text-xs">{s.description}</p>
                            </div>
                          ) : (
                            <div className="text-center min-w-[180px]">
                              <Lock className="w-5 h-5 mx-auto text-black mb-1" />
                              <p className="text-xs font-semibold">Locked Secret</p>
                              <Button size="sm" className="mt-2 bg-accent text-accent-foreground" onClick={() => reveal(s.id)}>
                                <Sparkles className="w-3 h-3 mr-1" /> Unlock
                              </Button>
                            </div>
                          )}
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-black" /> {secrets.length} secrets on the map</div>
          <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-black" /> Click locked pins to reveal</div>
          <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> {revealed.size} unlocked this session</div>
        </div>
      </div>
    </div>
  );
};

export default MapExplorer;
