import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, Calendar, DollarSign, Lightbulb, Loader2, Plane,
  Camera, UtensilsCrossed, Mountain, Palmtree, Landmark,
  Hotel, Package, ChevronRight, Star, Backpack, Navigation,
  Clock, CheckCircle2, ArrowRight, Share2, Copy, Check,
} from "lucide-react";
import Header from "@/components/Header";

const activityIcons: Record<string, React.ElementType> = {
  sightseeing: Camera,
  food: UtensilsCrossed,
  adventure: Mountain,
  relaxation: Palmtree,
  culture: Landmark,
  transport: Navigation,
};

interface Activity {
  time: string;
  activity: string;
  description: string;
  type: string;
  cost_estimate?: string;
  hidden_gem?: boolean;
  photo_spot?: boolean;
  local_food_tip?: string;
  insider_tip?: string;
  community_pick?: boolean;
}

interface DayPlan {
  day: number;
  title: string;
  activities: Activity[];
}

interface FlightSuggestion {
  from_hub: string;
  to: string;
  estimated_price_range: string;
  flight_duration: string;
}

interface HotelSuggestion {
  name: string;
  area: string;
  style: string;
  estimated_price_range: string;
}

interface Itinerary {
  destination: string;
  destination_airport?: string;
  duration: string;
  summary: string;
  days: DayPlan[];
  estimated_budget: string;
  best_season: string;
  tips: string[];
  packing_essentials?: string[];
  flight_suggestion?: FlightSuggestion;
  hotel_suggestion?: HotelSuggestion;
}

const activityTypeColors: Record<string, string> = {
  sightseeing: "bg-blue-50 text-blue-700 border-blue-200",
  food: "bg-orange-50 text-orange-700 border-orange-200",
  adventure: "bg-green-50 text-green-700 border-green-200",
  relaxation: "bg-purple-50 text-purple-700 border-purple-200",
  culture: "bg-yellow-50 text-yellow-800 border-yellow-200",
  transport: "bg-gray-50 text-gray-600 border-gray-200",
};

const ItineraryView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeDay, setActiveDay] = useState(1);
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    const savedId = searchParams.get("id");
    if (savedId) {
      loadSavedItinerary(savedId);
    } else {
      generateItinerary();
    }
  }, [user]);

  const loadSavedItinerary = async (id: string) => {
    const { data, error } = await supabase
      .from("itineraries")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      setError("Could not load itinerary.");
      setLoading(false);
      return;
    }
    const plan = data.plan as any;
    setItinerary({
      destination: data.destination,
      duration: data.duration,
      summary: plan?.summary || "",
      days: plan?.days || [],
      estimated_budget: plan?.estimated_budget || "",
      best_season: plan?.best_season || "",
      tips: plan?.tips || [],
      packing_essentials: plan?.packing_essentials || [],
      flight_suggestion: plan?.flight_suggestion,
      hotel_suggestion: plan?.hotel_suggestion,
    });
    setSavedItineraryId(id);
    setLoading(false);
  };

  const generateItinerary = async () => {
    try {
      const { data: quiz, error: qErr } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (qErr || !quiz) {
        setError("Complete the travel quiz first to get your itinerary!");
        setLoading(false);
        return;
      }

      const { data: fnData, error: fnError } = await supabase.functions.invoke("generate-itinerary", {
        body: {
          travel_style: quiz.travel_style,
          trip_duration: quiz.trip_duration,
          budget: quiz.budget,
          travel_companions: quiz.travel_companions,
        },
      });

      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);

      setItinerary(fnData);

      const { data: saved } = await supabase.from("itineraries").insert({
        user_id: user!.id,
        quiz_result_id: quiz.id,
        destination: fnData.destination || "Mystery Destination",
        duration: fnData.duration || quiz.trip_duration,
        plan: fnData,
      }).select("id").maybeSingle();

      if (saved) setSavedItineraryId(saved.id);
    } catch (e: any) {
      console.error("Itinerary generation error:", e);
      setError(e.message || "Failed to generate itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBookFlight = () => {
    const city = itinerary?.destination?.split(",")[0] || "";
    navigate(`/flights?destination=${encodeURIComponent(city)}`);
  };

  const goBookHotel = () => {
    const city = itinerary?.destination?.split(",")[0] || "";
    navigate(`/hotels?destination=${encodeURIComponent(city)}`);
  };

  const handleShare = async () => {
    if (!savedItineraryId) return;
    setSharing(true);
    try {
      // Check if already has a token
      const { data: existing } = await supabase
        .from("itineraries")
        .select("shared_token")
        .eq("id", savedItineraryId)
        .maybeSingle();

      let token = (existing as any)?.shared_token;
      if (!token) {
        token = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
        await supabase
          .from("itineraries")
          .update({ shared_token: token } as any)
          .eq("id", savedItineraryId);
      }

      const url = `${window.location.origin}/shared/${token}`;
      setShareUrl(url);

      if (navigator.share) {
        await navigator.share({ title: `Trip to ${itinerary?.destination}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "Link copied!", description: "Share this link with your friends." });
      }
    } catch (e) {
      console.error("Share error:", e);
    } finally {
      setSharing(false);
    }
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="h-[52px]" />
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-black/10 flex items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-black" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full animate-bounce" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Crafting Your Mystery Trip...</h2>
            <p className="text-gray-500 text-sm">Our AI is picking the perfect destination just for you</p>
            <p className="text-gray-400 text-xs mt-1">This may take up to 30 seconds</p>
          </div>
          <div className="flex gap-2">
            {["Analyzing preferences", "Selecting destination", "Planning activities"].map((step, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-400 bg-white border rounded-full px-3 py-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="h-[52px]" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">No Itinerary Yet</h2>
          <p className="text-gray-500 max-w-sm">{error}</p>
          <Button onClick={() => navigate("/#quiz")} className="bg-black text-white">
            Take the Quiz
          </Button>
        </div>
      </div>
    );
  }

  if (!itinerary) return null;

  const currentDayPlan = itinerary.days?.find(d => d.day === activeDay);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="h-[52px]" />

      {/* Hero Banner */}
      <div className="bg-[#2d2d2d] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full translate-x-48 -translate-y-48" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black rounded-full -translate-x-32 translate-y-32" />
        </div>
        <div className="container mx-auto px-4 py-16 text-center relative">
          <Badge className="bg-accent text-black border-0 mb-4 text-xs font-bold uppercase tracking-wider px-4 py-1.5">
            🎯 Your Mystery Destination Revealed
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tight">{itinerary.destination}</h1>
          <p className="text-white/60 text-sm max-w-2xl mx-auto leading-relaxed">{itinerary.summary}</p>
          
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-full px-4 py-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span>{itinerary.duration}</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-full px-4 py-2">
              <DollarSign className="w-4 h-4 text-accent" />
              <span>{itinerary.estimated_budget}</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-full px-4 py-2">
              <Star className="w-4 h-4 text-accent" />
              <span>Best: {itinerary.best_season}</span>
            </div>
          </div>

          {/* Share Button */}
          {savedItineraryId && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <Button
                onClick={handleShare}
                disabled={sharing}
                className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-full text-xs font-semibold gap-2 px-6"
                variant="outline"
              >
                {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                Share This Trip
              </Button>
              {shareUrl && (
                <button
                  onClick={copyShareUrl}
                  className="flex items-center gap-2 text-white/50 hover:text-white text-xs transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : shareUrl}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Book Your Trip CTA Banner */}
      <div className="bg-accent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-black" />
              <span className="font-bold text-black text-sm">Ready to book? We've planned everything — now make it official.</span>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={goBookFlight} size="sm" className="bg-black text-white hover:bg-black/80 rounded-lg font-semibold text-xs gap-1.5">
                <Plane className="w-3.5 h-3.5" /> Book Flight
              </Button>
              <Button onClick={goBookHotel} size="sm" className="bg-white text-black hover:bg-white/90 rounded-lg font-semibold text-xs gap-1.5">
                <Hotel className="w-3.5 h-3.5" /> Book Hotel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main: Day-by-day */}
          <div className="lg:col-span-2">
            {/* Day Selector */}
            {itinerary.days?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Your Day-by-Day Plan</h2>
                <div className="flex gap-2 flex-wrap">
                  {itinerary.days.map((day) => (
                    <button
                      key={day.day}
                      onClick={() => setActiveDay(day.day)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        activeDay === day.day
                          ? "bg-[#2d2d2d] text-white"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      Day {day.day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Day Plan */}
            {currentDayPlan && (
              <Card className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-[#2d2d2d] px-6 py-4 flex items-center justify-between">
                  <div>
                    <span className="text-white/60 text-xs uppercase tracking-wider">Day {currentDayPlan.day}</span>
                    <h3 className="text-white font-bold text-base">{currentDayPlan.title}</h3>
                  </div>
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-black font-black text-sm">
                    {currentDayPlan.day}
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="relative">
                    {currentDayPlan.activities?.map((act, j) => {
                      const Icon = activityIcons[act.type] || MapPin;
                      const colorClass = activityTypeColors[act.type] || "bg-gray-50 text-gray-600 border-gray-200";
                      return (
                        <div key={j} className="flex gap-4 mb-6 last:mb-0 relative">
                          {j < currentDayPlan.activities.length - 1 && (
                            <div className="absolute left-5 top-10 bottom-0 w-[1px] bg-gray-100" />
                          )}
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                            <Icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{act.time}
                              </span>
                              <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 capitalize ${colorClass}`}>
                                {act.type}
                              </span>
                              {act.cost_estimate && (
                                <span className="text-[10px] text-gray-400">{act.cost_estimate}</span>
                              )}
                              {act.hidden_gem && <span className="text-[9px] bg-purple-100 text-purple-700 rounded-full px-1.5 py-0.5 font-semibold">✨ Hidden Gem</span>}
                              {act.photo_spot && <span className="text-[9px] bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 font-semibold">📸 Photo Spot</span>}
                              {act.community_pick && <span className="text-[9px] bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 font-semibold">🤝 Community</span>}
                            </div>
                            <p className="font-bold text-sm text-gray-900">{act.activity}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{act.description}</p>
                            {act.local_food_tip && <p className="text-xs text-orange-600 mt-1">🍴 {act.local_food_tip}</p>}
                            {act.insider_tip && <p className="text-xs text-purple-600 mt-1 italic">💡 {act.insider_tip}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Day navigation */}
            <div className="flex justify-between mt-4">
              {activeDay > 1 ? (
                <Button variant="outline" size="sm" onClick={() => setActiveDay(d => d - 1)} className="text-xs gap-1">
                  ← Day {activeDay - 1}
                </Button>
              ) : <div />}
              {activeDay < (itinerary.days?.length || 1) && (
                <Button variant="outline" size="sm" onClick={() => setActiveDay(d => d + 1)} className="text-xs gap-1 ml-auto">
                  Day {activeDay + 1} →
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Flight Suggestion */}
            {itinerary.flight_suggestion && (
              <Card className="bg-white rounded-xl overflow-hidden shadow-sm border-0">
                <div className="bg-black/10 px-5 py-3 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-black" />
                  <span className="font-bold text-sm text-gray-900">Suggested Flight</span>
                </div>
                <CardContent className="p-5">
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{itinerary.flight_suggestion.from_hub} → {itinerary.flight_suggestion.to}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{itinerary.flight_suggestion.flight_duration}</span>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                      <DollarSign className="w-3.5 h-3.5 text-accent" />
                      <span>{itinerary.flight_suggestion.estimated_price_range}</span>
                    </div>
                  </div>
                  <Button onClick={goBookFlight} className="w-full bg-[#2d2d2d] text-white hover:bg-black rounded-lg text-xs font-bold gap-2">
                    <Plane className="w-3.5 h-3.5" /> Browse & Book Flights
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Hotel Suggestion */}
            {itinerary.hotel_suggestion && (
              <Card className="bg-white rounded-xl overflow-hidden shadow-sm border-0">
                <div className="bg-accent/10 px-5 py-3 flex items-center gap-2">
                  <Hotel className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-sm text-gray-900">Suggested Stay</span>
                </div>
                <CardContent className="p-5">
                  <div className="space-y-2 text-sm mb-4">
                    <p className="font-semibold text-gray-900">{itinerary.hotel_suggestion.name}</p>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{itinerary.hotel_suggestion.area}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">{itinerary.hotel_suggestion.style}</Badge>
                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                      <DollarSign className="w-3.5 h-3.5 text-accent" />
                      <span>{itinerary.hotel_suggestion.estimated_price_range}</span>
                    </div>
                  </div>
                  <Button onClick={goBookHotel} className="w-full bg-accent text-black hover:bg-accent/90 rounded-lg text-xs font-bold gap-2">
                    <Hotel className="w-3.5 h-3.5" /> Browse & Book Hotels
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            {itinerary.tips?.length > 0 && (
              <Card className="bg-white rounded-xl shadow-sm border-0">
                <CardContent className="p-5">
                  <h3 className="font-bold text-sm flex items-center gap-2 mb-3 text-gray-900">
                    <Lightbulb className="w-4 h-4 text-accent" />Travel Tips
                  </h3>
                  <ul className="space-y-2">
                    {itinerary.tips.map((tip, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Packing */}
            {itinerary.packing_essentials && itinerary.packing_essentials.length > 0 && (
              <Card className="bg-white rounded-xl shadow-sm border-0">
                <CardContent className="p-5">
                  <h3 className="font-bold text-sm flex items-center gap-2 mb-3 text-gray-900">
                    <Backpack className="w-4 h-4 text-black" />Packing Essentials
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {itinerary.packing_essentials.map((item, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] text-gray-600">{item}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Complete Booking CTA */}
            <Card className="bg-[#2d2d2d] rounded-xl border-0 text-white shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-bold text-sm mb-1">Complete Your Booking</h3>
                <p className="text-white/60 text-xs mb-4">Lock in your trip to {itinerary.destination.split(",")[0]}</p>
                <div className="space-y-2">
                  <Button onClick={goBookFlight} className="w-full bg-accent text-black hover:bg-accent/90 rounded-lg text-xs font-bold gap-2 justify-start">
                    <Plane className="w-3.5 h-3.5" /> Step 1: Book Your Flight
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </Button>
                  <Button onClick={goBookHotel} variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 rounded-lg text-xs font-bold gap-2 justify-start">
                    <Hotel className="w-3.5 h-3.5" /> Step 2: Book Your Hotel
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </Button>
                  <Button onClick={() => navigate("/dashboard")} variant="ghost" className="w-full text-white/50 hover:text-white hover:bg-white/10 rounded-lg text-xs gap-2 justify-start">
                    View Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryView;
