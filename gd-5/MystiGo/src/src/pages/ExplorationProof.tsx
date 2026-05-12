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
import { Camera, MapPin, Loader2, Star, Plus, Calendar } from "lucide-react";

interface Proof {
  id: string;
  user_id: string;
  title: string;
  location: string;
  experience: string;
  rating: number | null;
  image_url: string | null;
  visited_on: string | null;
  created_at: string;
}

const ExplorationProof = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [rating, setRating] = useState(5);
  const [visited, setVisited] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("exploration_proofs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(60);
    setProofs((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate("/auth");
    if (!title || !location || !experience) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    let image_url: string | null = null;
    try {
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("proofs").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("proofs").getPublicUrl(path);
        image_url = pub.publicUrl;
      }
      const { error } = await supabase.from("exploration_proofs" as any).insert({
        user_id: user.id,
        title, location, experience, rating, image_url,
        visited_on: visited || null,
      } as any);
      if (error) throw error;
      toast({ title: "Proof shared! 🌍", description: "Thanks for inspiring fellow travellers." });
      setOpen(false);
      setTitle(""); setLocation(""); setExperience(""); setRating(5); setVisited(""); setFile(null);
      load();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="h-[52px]" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <Badge className="bg-accent text-accent-foreground mb-2">📸 Proof of Exploration</Badge>
            <h1 className="text-3xl font-black text-foreground">Stories from real travellers</h1>
            <p className="text-sm text-muted-foreground mt-1">Photos and reviews from places that genuinely surprised people.</p>
          </div>
          <Button onClick={() => user ? setOpen(true) : navigate("/auth")} className="bg-black text-black-foreground gap-2">
            <Plus className="w-4 h-4" /> Share your proof
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-black" /></div>
        ) : proofs.length === 0 ? (
          <Card className="p-12 text-center">
            <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold">No proofs shared yet</p>
            <p className="text-sm text-muted-foreground mt-1">Be the first to share a story!</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {proofs.map((p) => (
              <Card key={p.id} className="overflow-hidden hover:shadow-floating transition-all">
                {p.image_url && (
                  <div className="h-48 overflow-hidden bg-muted">
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-foreground">{p.title}</p>
                    {p.rating && (
                      <div className="flex items-center gap-0.5 text-accent text-xs">
                        <Star className="w-3 h-3 fill-current" /> {p.rating}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.location}</p>
                  <p className="text-sm text-foreground line-clamp-3">{p.experience}</p>
                  {p.visited_on && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(p.visited_on).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Camera className="w-5 h-5 text-accent" /> Share your proof</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sunset at the hidden cliff" /></div>
            <div><Label>Location *</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Cinque Terre, Italy" /></div>
            <div><Label>Your experience *</Label><Textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="What made it special?" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Rating</Label>
                <select value={rating} onChange={(e) => setRating(parseInt(e.target.value))} className="w-full mt-1 p-2 rounded-md border border-input bg-background text-foreground text-sm">
                  {[1,2,3,4,5].map((n) => <option key={n} value={n}>{"⭐".repeat(n)}</option>)}
                </select>
              </div>
              <div><Label>Visited on</Label><Input type="date" value={visited} onChange={(e) => setVisited(e.target.value)} /></div>
            </div>
            <div><Label>Photo</Label><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
            <Button type="submit" disabled={submitting} className="w-full bg-black text-black-foreground">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share proof"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExplorationProof;
