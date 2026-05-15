import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AddLocalSecretForm from "@/components/AddLocalSecretForm";
import { MapPin, Plus, Search, Loader2, UtensilsCrossed, Lightbulb, TreePine, Landmark } from "lucide-react";

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  hidden_place: { label: "Hidden Place", icon: Landmark, color: "bg-blue-50 text-blue-700" },
  food_spot: { label: "Food Spot", icon: UtensilsCrossed, color: "bg-orange-50 text-orange-700" },
  local_tip: { label: "Local Tip", icon: Lightbulb, color: "bg-yellow-50 text-yellow-800" },
  less_crowded: { label: "Less Crowded", icon: TreePine, color: "bg-green-50 text-green-700" },
};

interface LocalSecret {
  id: string;
  location: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
}

const LocalSecrets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [secrets, setSecrets] = useState<LocalSecret[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchSecrets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("local_secrets" as any)
      .select("id, location, title, description, category, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) setSecrets(data as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchSecrets(); }, []);

  const filtered = secrets.filter((s) =>
    s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="h-[52px]" />

      {/* Hero */}
      <div className="bg-[#2d2d2d] text-white py-14">
        <div className="container mx-auto px-4 text-center">
          <Badge className="bg-accent text-black border-0 text-xs font-bold uppercase tracking-widest px-5 py-2 mb-4">
            🤫 Community Secrets
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black mb-3">Local Secrets</h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Discover hidden gems shared by travelers and locals. The best tips money can't buy.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Search + Add */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by location, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => user ? setShowAddForm(true) : navigate("/auth")}
            className="bg-accent text-black hover:bg-accent/90 font-bold gap-2"
          >
            <Plus className="w-4 h-4" /> Share a Secret
          </Button>
        </div>

        {/* Secrets Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchQuery ? "No secrets found" : "No secrets yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {searchQuery ? "Try a different search term." : "Be the first to share a local secret!"}
            </p>
            {!searchQuery && (
              <Button onClick={() => user ? setShowAddForm(true) : navigate("/auth")} className="bg-accent text-black hover:bg-accent/90 font-bold gap-2">
                <Plus className="w-4 h-4" /> Share First Secret
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((secret) => {
              const config = categoryConfig[secret.category] || categoryConfig.local_tip;
              const Icon = config.icon;
              return (
                <Card key={secret.id} className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={`text-[10px] font-semibold border-0 gap-1 ${config.color}`}>
                        <Icon className="w-3 h-3" /> {config.label}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 mb-1">{secret.title}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" /> {secret.location}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                      {secret.description}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-3">
                      {new Date(secret.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AddLocalSecretForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={fetchSecrets} />
    </div>
  );
};

export default LocalSecrets;
