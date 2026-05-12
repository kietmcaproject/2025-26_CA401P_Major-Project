import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Plus, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const categories = [
  { value: "hidden_place", label: "🏛️ Hidden Place" },
  { value: "food_spot", label: "🍜 Secret Food Spot" },
  { value: "local_tip", label: "💡 Local Tip" },
  { value: "less_crowded", label: "🌿 Less Crowded Spot" },
];

const AddLocalSecretForm = ({ open, onOpenChange, onSuccess }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("local_tip");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to share local secrets.", variant: "destructive" });
      return;
    }
    if (!location.trim() || !title.trim() || !description.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("local_secrets" as any).insert({
        user_id: user.id,
        location: location.trim(),
        title: title.trim(),
        description: description.trim(),
        category,
      } as any);

      if (error) throw error;

      toast({ title: "Secret shared! 🎉", description: "Thanks for helping fellow travelers discover hidden gems!" });
      setLocation(""); setTitle(""); setDescription(""); setCategory("local_tip");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({ title: "Failed to share", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            Share a Local Secret
          </DialogTitle>
          <DialogDescription>
            Help fellow travelers discover hidden gems! Share a place, food spot, or tip that only locals know.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Location *</Label>
            <Input placeholder="e.g. Tokyo, Japan" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">Title *</Label>
            <Input placeholder="e.g. Secret rooftop cafe with city views" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Description *</Label>
            <Textarea
              placeholder="Tell us why this place is special, how to find it, best time to visit..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-accent text-black hover:bg-accent/90 font-bold gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? "Sharing..." : "Share Secret"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLocalSecretForm;
