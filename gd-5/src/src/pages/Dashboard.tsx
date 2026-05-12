import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, Calendar, Star, Trophy, Plane, Plus, LogOut, Hotel, Map, Sparkles
} from 'lucide-react';
import GenerateItineraryDialog from '@/components/GenerateItineraryDialog';
import TravelChatbot from '@/components/TravelChatbot';

interface QuizResult { id: string; travel_style: string; trip_duration: string; budget: string; travel_companions: string; created_at: string; }
interface Booking { id: string; full_name: string; email: string; budget_range: string; num_travelers: string; preferences: string | null; status: string; created_at: string; }
interface Flight { id: string; airline: string; flight_number: string; departure_city: string; arrival_city: string; departure_date: string; price: number; class: string; status: string; }
interface HotelBooking { id: string; hotel_name: string; city: string; check_in: string; check_out: string; room_type: string; total_price: number; status: string; }
interface Itinerary { id: string; destination: string; duration: string; created_at: string; }
interface Profile { full_name: string | null; email: string | null; }

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [hotels, setHotels] = useState<HotelBooking[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenDialog, setShowGenDialog] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, quizRes, bookingsRes, flightsRes, hotelsRes, itinRes] = await Promise.all([
        supabase.from("profiles").select("full_name, email").eq("user_id", user.id).maybeSingle(),
        supabase.from("quiz_results").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("bookings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("flights").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("hotels").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("itineraries").select("id, destination, duration, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (quizRes.data) setQuizResults(quizRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (flightsRes.data) setFlights(flightsRes.data as Flight[]);
      if (hotelsRes.data) setHotels(hotelsRes.data as HotelBooking[]);
      if (itinRes.data) setItineraries(itinRes.data as Itinerary[]);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Explorer";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#2d2d2d] text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="/" className="text-xl font-extrabold tracking-widest uppercase">MYSTIGO</a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70">{user?.email}</span>
            <Button onClick={handleSignOut} variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {displayName}! 👋</h1>
        <p className="text-gray-500 mb-8">Here's your travel overview</p>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Concierge Bookings */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Trip Requests</h2>
                <Button onClick={() => navigate("/#contact")} size="sm" className="bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]">
                  <Plus className="w-4 h-4 mr-1" /> New Request
                </Button>
              </div>
              {bookings.length === 0 ? (
                <Card className="p-8 text-center bg-white rounded-xl">
                  <Plane className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No trip requests yet.</p>
                  <Button onClick={() => navigate("/#contact")} className="mt-4 bg-accent text-black hover:bg-accent/90 text-sm">Plan a Trip</Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <Card key={b.id} className="p-5 bg-white rounded-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{b.full_name}</h3>
                          <p className="text-sm text-gray-500">Budget: {b.budget_range} · {b.num_travelers} traveler(s)</p>
                          {b.preferences && <p className="text-sm text-gray-400 mt-1 line-clamp-1">{b.preferences}</p>}
                        </div>
                        <Badge className={b.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>{b.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{new Date(b.created_at).toLocaleDateString()}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Flights */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">✈️ Flight Bookings</h2>
                <Button onClick={() => navigate("/flights")} size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Book Flight</Button>
              </div>
              {flights.length === 0 ? (
                <Card className="p-6 text-center bg-white rounded-xl">
                  <p className="text-gray-500 text-sm">No flights booked yet.</p>
                  <Button onClick={() => navigate("/flights")} className="mt-3 bg-accent text-black hover:bg-accent/90 text-sm">Browse Flights</Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {flights.map((f) => (
                    <Card key={f.id} className="p-4 bg-white rounded-xl">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center"><Plane className="w-4 h-4 text-black" /></div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{f.departure_city.split("(")[0]} → {f.arrival_city.split("(")[0]}</p>
                            <p className="text-xs text-gray-400">{f.airline} · {f.flight_number} · {new Date(f.departure_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${f.price}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">{f.class}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Hotels */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">🏨 Hotel Bookings</h2>
                <Button onClick={() => navigate("/hotels")} size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Book Hotel</Button>
              </div>
              {hotels.length === 0 ? (
                <Card className="p-6 text-center bg-white rounded-xl">
                  <p className="text-gray-500 text-sm">No hotels booked yet.</p>
                  <Button onClick={() => navigate("/hotels")} className="mt-3 bg-accent text-black hover:bg-accent/90 text-sm">Browse Hotels</Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {hotels.map((h) => (
                    <Card key={h.id} className="p-4 bg-white rounded-xl">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center"><Hotel className="w-4 h-4 text-accent" /></div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{h.hotel_name}</p>
                            <p className="text-xs text-gray-400">{h.city} · {h.check_in} to {h.check_out}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">${h.total_price}</p>
                          <Badge variant="outline" className="text-[10px] capitalize">{h.room_type}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Itineraries */}
            <Card className="p-6 bg-white rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Map className="w-5 h-5 mr-2 text-black" /> Your Itineraries
              </h3>
              {itineraries.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-3">Generate your first AI itinerary!</p>
                  <Button onClick={() => setShowGenDialog(true)} size="sm" className="bg-black text-white hover:bg-black/90 text-sm gap-1">
                    <Sparkles className="w-3 h-3" /> Generate
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {itineraries.slice(0, 5).map((it) => (
                    <button key={it.id} onClick={() => navigate(`/itinerary?id=${it.id}`)} className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <p className="font-semibold text-sm text-gray-900">{it.destination}</p>
                      <p className="text-xs text-gray-400">{it.duration} · {new Date(it.created_at).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Quiz Results */}
            <Card className="p-6 bg-white rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" /> Travel Preferences
              </h3>
              {quizResults.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-3">Take the quiz to discover your style!</p>
                  <Button onClick={() => navigate("/#quiz")} size="sm" className="bg-accent text-black hover:bg-accent/90 text-sm">Take Quiz</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizResults.slice(0, 2).map((result) => (
                    <div key={result.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-gray-400">Style:</span> <span className="font-medium text-gray-700">{result.travel_style}</span></div>
                        <div><span className="text-gray-400">Duration:</span> <span className="font-medium text-gray-700">{result.trip_duration}</span></div>
                        <div><span className="text-gray-400">Budget:</span> <span className="font-medium text-gray-700">{result.budget}</span></div>
                        <div><span className="text-gray-400">With:</span> <span className="font-medium text-gray-700">{result.travel_companions}</span></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{new Date(result.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Stats */}
            <Card className="p-6 bg-white rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" /> Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Trip Requests</span><span className="font-semibold text-gray-900">{bookings.length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Flights Booked</span><span className="font-semibold text-gray-900">{flights.length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Hotels Booked</span><span className="font-semibold text-gray-900">{hotels.length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Itineraries</span><span className="font-semibold text-gray-900">{itineraries.length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Member Since</span><span className="font-semibold text-gray-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</span></div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 bg-white rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-sm" onClick={() => navigate("/flights")}>
                  <Plane className="w-4 h-4 mr-2" /> Browse Flights
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" onClick={() => navigate("/hotels")}>
                  <Hotel className="w-4 h-4 mr-2" /> Browse Hotels
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" onClick={() => setShowGenDialog(true)}>
                  <Map className="w-4 h-4 mr-2" /> Generate Itinerary
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" onClick={() => navigate("/local-secrets")}>
                  <MapPin className="w-4 h-4 mr-2" /> Local Secrets
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" onClick={() => navigate("/#quiz")}>
                  <Sparkles className="w-4 h-4 mr-2" /> Take Quiz
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <GenerateItineraryDialog open={showGenDialog} onOpenChange={setShowGenDialog} />
      <TravelChatbot />
    </div>
  );
};

export default Dashboard;
