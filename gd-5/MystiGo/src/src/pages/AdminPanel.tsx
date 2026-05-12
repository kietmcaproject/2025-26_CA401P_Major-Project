import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, Users, Camera, MapPin, BookOpen } from "lucide-react";

const AdminPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, buddies: 0, proofs: 0, secrets: 0, bookings: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentProofs, setRecentProofs] = useState<any[]>([]);
  const [recentBuddies, setRecentBuddies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !roleLoading && !isAdmin) navigate("/");
  }, [isAdmin, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [profiles, buddies, proofs, secrets, bookings, recBookings, recProofs, recBuddies] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("travel_buddies" as any).select("id", { count: "exact", head: true }),
        supabase.from("exploration_proofs" as any).select("id", { count: "exact", head: true }),
        supabase.from("local_secrets" as any).select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("exploration_proofs" as any).select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("travel_buddies" as any).select("*").order("created_at", { ascending: false }).limit(10),
      ]);
      setStats({
        users: profiles.count || 0,
        buddies: buddies.count || 0,
        proofs: proofs.count || 0,
        secrets: secrets.count || 0,
        bookings: bookings.count || 0,
      });
      setRecentBookings((recBookings.data as any) || []);
      setRecentProofs((recProofs.data as any) || []);
      setRecentBuddies((recBuddies.data as any) || []);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-black" /></div>;
  }
  if (!isAdmin) return null;

  const StatCard = ({ icon: Icon, label, value }: any) => (
    <Card><CardContent className="p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center"><Icon className="w-5 h-5 text-black" /></div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-foreground">{value}</p>
        </div>
      </div>
    </CardContent></Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="h-[52px]" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-7 h-7 text-accent" />
          <div>
            <h1 className="text-3xl font-black text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Platform overview and moderation</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <StatCard icon={Users} label="Users" value={stats.users} />
          <StatCard icon={Users} label="Buddies" value={stats.buddies} />
          <StatCard icon={Camera} label="Proofs" value={stats.proofs} />
          <StatCard icon={MapPin} label="Secrets" value={stats.secrets} />
          <StatCard icon={BookOpen} label="Bookings" value={stats.bookings} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-black" /></div>
        ) : (
          <Tabs defaultValue="bookings">
            <TabsList>
              <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
              <TabsTrigger value="proofs">Recent Proofs</TabsTrigger>
              <TabsTrigger value="buddies">Recent Buddies</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="mt-4 space-y-2">
              {recentBookings.map((b) => (
                <Card key={b.id}><CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-foreground">{b.full_name}</p>
                    <p className="text-xs text-muted-foreground">{b.email} · {b.num_travelers} travellers · {b.budget_range}</p>
                  </div>
                  <Badge variant={b.status === "pending" ? "outline" : "default"}>{b.status}</Badge>
                </CardContent></Card>
              ))}
              {recentBookings.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No bookings yet</p>}
            </TabsContent>

            <TabsContent value="proofs" className="mt-4 space-y-2">
              {recentProofs.map((p) => (
                <Card key={p.id}><CardContent className="p-4 flex items-center gap-3">
                  {p.image_url && <img src={p.image_url} className="w-14 h-14 rounded-md object-cover" />}
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.location} · ⭐ {p.rating || "—"}</p>
                  </div>
                </CardContent></Card>
              ))}
              {recentProofs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No proofs yet</p>}
            </TabsContent>

            <TabsContent value="buddies" className="mt-4 space-y-2">
              {recentBuddies.map((b) => (
                <Card key={b.id}><CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">{b.display_name}</p>
                    <p className="text-xs text-muted-foreground">{b.destination} · {new Date(b.travel_start).toLocaleDateString()} – {new Date(b.travel_end).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={b.is_active ? "default" : "outline"}>{b.is_active ? "active" : "inactive"}</Badge>
                </CardContent></Card>
              ))}
              {recentBuddies.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No buddies yet</p>}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
