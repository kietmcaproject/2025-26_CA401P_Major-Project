import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, MapPin, Calendar, Loader2, UserPlus, Send, Sparkles } from "lucide-react";

interface Buddy {
  id: string;
  user_id: string;
  display_name: string;
  destination: string;
  travel_start: string;
  travel_end: string;
  interests: string[];
  bio: string | null;
  avatar_url: string | null;
}

const TravelBuddies = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openRequest, setOpenRequest] = useState<Buddy | null>(null);
  const [reqMsg, setReqMsg] = useState("");

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [destination, setDestination] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [interests, setInterests] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("travel_buddies" as any)
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100);
    setBuddies((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = buddies.filter((b) =>
    !search.trim() ||
    b.destination.toLowerCase().includes(search.toLowerCase()) ||
    b.interests?.some((i) => i.toLowerCase().includes(search.toLowerCase()))
  );

  const createProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate("/auth");
    if (!displayName || !destination || !start || !end) {
      toast({ title: "Missing fields", description: "Fill in name, destination, and dates.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("travel_buddies" as any).insert({
      user_id: user.id,
      display_name: displayName,
      destination,
      travel_start: start,
      travel_end: end,
      interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
      bio: bio || null,
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile created! 🎉", description: "Other travellers can now find you." });
      setOpenCreate(false);
      setDisplayName(""); setDestination(""); setStart(""); setEnd(""); setInterests(""); setBio("");
      load();
    }
  };

  const sendRequest = async () => {
    if (!user || !openRequest) return;
    const { error } = await supabase.from("buddy_requests" as any).insert({
      sender_id: user.id,
      receiver_id: openRequest.user_id,
      receiver_buddy_id: openRequest.id,
      message: reqMsg || null,
    } as any);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request sent! ✈️", description: `${openRequest.display_name} will be notified.` });
      setOpenRequest(null);
      setReqMsg("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="h-[52px]" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <Badge className="bg-accent text-accent-foreground mb-2">👥 Travel Buddies</Badge>
            <h1 className="text-3xl font-black text-foreground">Find your travel match</h1>
            <p className="text-sm text-muted-foreground mt-1">Connect with travellers heading to the same destination.</p>
          </div>
          <Button onClick={() => user ? setOpenCreate(true) : navigate("/auth")} className="bg-black text-black-foreground gap-2">
            <UserPlus className="w-4 h-4" /> Create my profile
          </Button>
        </div>

        <Input
          placeholder="Search by destination or interest (e.g. 'Bali', 'hiking')…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 max-w-md"
        />

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-black" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold">No buddies found yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to create a profile for this destination!</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((b) => (
              <Card key={b.id} className="hover:shadow-floating transition-all">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-black to-accent flex items-center justify-center text-black-foreground font-bold text-lg">
                      {b.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{b.display_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {b.destination}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(b.travel_start).toLocaleDateString()} – {new Date(b.travel_end).toLocaleDateString()}
                  </p>
                  {b.bio && <p className="text-sm text-foreground line-clamp-2">{b.bio}</p>}
                  {b.interests?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {b.interests.slice(0, 4).map((i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{i}</Badge>
                      ))}
                    </div>
                  )}
                  {user && user.id !== b.user_id && (
                    <Button onClick={() => setOpenRequest(b)} size="sm" className="w-full bg-accent text-accent-foreground gap-2">
                      <Send className="w-3 h-3" /> Send request
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create profile dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent" /> Create buddy profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={createProfile} className="space-y-3">
            <div><Label>Display name *</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
            <div><Label>Destination *</Label><Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Lisbon, Portugal" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Start date *</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
              <div><Label>End date *</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
            </div>
            <div><Label>Interests (comma-separated)</Label><Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="hiking, food, photography" /></div>
            <div><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell other travellers about you…" /></div>
            <Button type="submit" disabled={saving} className="w-full bg-black text-black-foreground">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create profile"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Send request dialog */}
      <Dialog open={!!openRequest} onOpenChange={(o) => !o && setOpenRequest(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Connect with {openRequest?.display_name}</DialogTitle></DialogHeader>
          <Textarea value={reqMsg} onChange={(e) => setReqMsg(e.target.value)} placeholder="Hey! I'd love to connect — I'm planning the same trip…" />
          <Button onClick={sendRequest} className="w-full bg-accent text-accent-foreground gap-2">
            <Send className="w-4 h-4" /> Send request
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TravelBuddies;
