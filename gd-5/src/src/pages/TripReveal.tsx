import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, Calendar, DollarSign, Loader2, Plane, Hotel,
  Star, Clock, ChevronRight, Check, Sparkles, Globe,
  ArrowRight, Package, Camera, UtensilsCrossed, Mountain,
  Palmtree, Landmark, Navigation, CheckCircle2, Backpack,
  HelpCircle, Eye, Lock, RefreshCw, Image as ImageIcon, Target,
} from "lucide-react";
import Header from "@/components/Header";
import BudgetBreakdown from "@/components/BudgetBreakdown";
import SuspenseReveal from "@/components/SuspenseReveal";
import { Download } from "lucide-react";
import { exportItineraryPdf } from "@/lib/exportItineraryPdf";

const activityIcons: Record<string, React.ElementType> = {
  sightseeing: Camera, food: UtensilsCrossed, adventure: Mountain,
  relaxation: Palmtree, culture: Landmark, transport: Navigation,
};

const activityTypeColors: Record<string, string> = {
  sightseeing: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  food: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  adventure: "bg-green-500/15 text-green-300 border-green-500/30",
  relaxation: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  culture: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  transport: "bg-muted text-muted-foreground border-border",
};

type Phase = "generating" | "choose" | "building" | "destination" | "itinerary" | "flights" | "hotels" | "summary";

interface DestinationOption {
  id: number; name: string; tagline: string; hints: string[];
  match_score: number; highlights: string[];
  estimated_budget: string; best_for: string; mystery: boolean;
}

interface Activity { time: string; activity: string; description: string; type: string; cost_estimate?: string; hidden_gem?: boolean; photo_spot?: boolean; local_food_tip?: string; insider_tip?: string; community_pick?: boolean; }
interface DayPlan { day: number; title: string; activities: Activity[]; }
interface FlightSuggestion { from_hub: string; to: string; estimated_price_range: string; flight_duration: string; }
interface HotelSuggestion { name: string; area: string; style: string; estimated_price_range: string; }
interface Itinerary {
  destination: string; destination_airport?: string; duration: string; summary: string;
  days: DayPlan[]; estimated_budget: string; best_season: string; tips: string[];
  packing_essentials?: string[]; flight_suggestion?: FlightSuggestion; hotel_suggestion?: HotelSuggestion;
  budget_breakdown?: Record<string, string>;
}

interface RealFlight {
  airline: string; flight_number: string; from: string; to: string;
  depart: string; arrive: string; duration: string; price: number;
  class: string; stops: string;
}

interface RealHotel {
  name: string; city: string; price: number; rating: number;
  room_type: string; image_url: string;
}

function getVal(v: string | string[] | undefined, fallback: string): string {
  if (!v) return fallback;
  return Array.isArray(v) ? v[0] || fallback : v;
}

function getArr(v: string | string[] | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? v.join(", ") : v;
}

const TripReveal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const quizData = (location.state as any)?.quizData;
  const directDestination = (location.state as any)?.directDestination;

  const [phase, setPhase] = useState<Phase>("generating");
  const [destinations, setDestinations] = useState<DestinationOption[]>([]);
  const [selectedDest, setSelectedDest] = useState<number | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [flights, setFlights] = useState<RealFlight[]>([]);
  const [hotels, setHotels] = useState<RealHotel[]>([]);
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [error, setError] = useState("");
  const [selectedFlight, setSelectedFlight] = useState<number | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);
  const [bookingFlight, setBookingFlight] = useState(false);
  const [bookingHotel, setBookingHotel] = useState(false);
  const [previousDestinations, setPreviousDestinations] = useState<string[]>([]);
  const [exploringAlternative, setExploringAlternative] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (!quizData) { navigate("/#quiz"); return; }
    // Dashboard flow: user typed a destination → skip mystery selection
    if (directDestination) {
      generateItinerary(directDestination);
    } else {
      suggestDestinations();
    }
  }, []);

  const currencySymbol = (() => {
    const c = quizData?.currency;
    if (!c) return "$";
    const match = c.match(/\((.+)\)$/);
    return match ? match[1] : "$";
  })();

  const suggestDestinations = async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-itinerary", {
        body: { ...quizData, mode: "suggest", flow: "reveal" },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setDestinations(data.destinations || []);
      setPhase("choose");
    } catch (e: any) {
      console.error("Suggestion error:", e);
      setError(e.message || "Failed to suggest destinations");
    }
  };

  const fetchLocalSecrets = async (destination: string) => {
    try {
      const city = destination.split(",")[0].trim().toLowerCase();
      const { data } = await supabase
        .from("local_secrets" as any)
        .select("location, title, description, category")
        .ilike("location" as any, `%${city}%`)
        .limit(10);
      return (data || []) as any[];
    } catch {
      return [];
    }
  };

  const generateItinerary = async (chosenDest: string, excludeList: string[] = []) => {
    setPhase("building");
    try {
      // Fetch local secrets for the destination
      const secrets = chosenDest !== "mystery" ? await fetchLocalSecrets(chosenDest) : [];

      const { data, error: fnError } = await supabase.functions.invoke("generate-itinerary", {
        body: {
          ...quizData,
          mode: "itinerary",
          flow: directDestination ? "dashboard" : "reveal",
          chosen_destination: chosenDest,
          local_secrets: secrets,
          exclude_destinations: excludeList,
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      // ── Ensure day count matches requested duration (pad if AI under-returned) ──
      const durStr = String(getVal(quizData.trip_duration, "5 days")).toLowerCase();
      let wantDays = 5;
      const wkM = durStr.match(/(\d+)\s*week/);
      const dyM = durStr.match(/(\d+)\s*[-\s]?day/);
      if (wkM) wantDays = parseInt(wkM[1]) * 7;
      else if (dyM) wantDays = parseInt(dyM[1]);
      wantDays = Math.max(2, Math.min(wantDays, 14));

      const got: DayPlan[] = Array.isArray(data.days) ? data.days : [];
      if (got.length < wantDays) {
        const last = got[got.length - 1];
        for (let d = got.length + 1; d <= wantDays; d++) {
          got.push({
            day: d,
            title: `Day ${d} — Free Exploration`,
            activities: last?.activities?.slice(0, 3).map((a) => ({
              ...a,
              activity: `${a.activity} (alt area)`,
              description: "Free day to wander and discover new spots based on your morning mood.",
            })) || [
              { time: "Morning", activity: "Slow start & local breakfast", description: "Wake up at your pace and find a local café.", type: "food" },
              { time: "Afternoon", activity: "Choose your own adventure", description: "Pick from the highlights of previous days you loved most.", type: "sightseeing" },
              { time: "Evening", activity: "Sunset walk & dinner", description: "End the day relaxed with a long dinner.", type: "relaxation" },
            ],
          });
        }
        data.days = got.map((d, i) => ({ ...d, day: i + 1 }));
      }
      setItinerary(data);
      // Track this destination so "Explore another" excludes it next time
      if (data.destination) {
        setPreviousDestinations((prev) => Array.from(new Set([...prev, data.destination])));
      }

      const { data: quiz } = await supabase.from("quiz_results")
        .select("id").eq("user_id", user!.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();

      await supabase.from("itineraries").insert({
        user_id: user!.id,
        quiz_result_id: quiz?.id || null,
        destination: data.destination || "Mystery Destination",
        duration: data.duration || getVal(quizData.trip_duration, "7 days"),
        plan: data,
      });

      setTimeout(() => setPhase("destination"), 500);
    } catch (e: any) {
      console.error("Generation error:", e);
      setError(e.message || "Failed to generate itinerary");
      setPhase("generating");
    }
  };

  const handleDestinationChoice = (dest: DestinationOption) => {
    setSelectedDest(dest.id);
    const chosenName = dest.mystery ? "mystery" : dest.name;
    generateItinerary(chosenName);
  };

  const exploreAnotherOption = async () => {
    if (!itinerary) return;
    setExploringAlternative(true);
    const newExclude = Array.from(new Set([...previousDestinations, itinerary.destination]));
    setPreviousDestinations(newExclude);
    try {
      await generateItinerary("mystery", newExclude);
      toast({ title: "Found a new option ✨", description: "Here's another hidden gem matched to your vibe." });
    } catch (e: any) {
      toast({ title: "Couldn't fetch alternative", description: e.message, variant: "destructive" });
    } finally {
      setExploringAlternative(false);
    }
  };

  const searchFlights = async () => {
    if (!itinerary) return;
    setFlightsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-flights", {
        body: { origin: getVal(quizData.departure_city, ""), destination: itinerary.destination, destination_airport: itinerary.destination_airport, budget: getVal(quizData.budget, "Comfortable"), currency: quizData.currency || "USD ($)" },
      });
      if (error) throw error;
      setFlights(data?.flights || []);
    } catch (e: any) {
      console.error("Flight search error:", e);
      if (itinerary.flight_suggestion) {
        setFlights([
          { airline: "MystiGo Air", flight_number: "MG-" + Math.floor(Math.random() * 900 + 100), from: itinerary.flight_suggestion.from_hub, to: itinerary.flight_suggestion.to, depart: "08:00", arrive: "16:30", duration: itinerary.flight_suggestion.flight_duration, price: parseInt(itinerary.flight_suggestion.estimated_price_range.replace(/[^0-9]/g, "")) || 800, class: "economy", stops: "1 stop" },
          { airline: "MystiGo Air", flight_number: "MG-" + Math.floor(Math.random() * 900 + 100), from: itinerary.flight_suggestion.from_hub, to: itinerary.flight_suggestion.to, depart: "14:30", arrive: "22:00", duration: itinerary.flight_suggestion.flight_duration, price: (parseInt(itinerary.flight_suggestion.estimated_price_range.replace(/[^0-9]/g, "")) || 800) + 200, class: "business", stops: "Direct" },
        ]);
      }
    } finally { setFlightsLoading(false); }
  };

  const searchHotels = async () => {
    if (!itinerary) return;
    setHotelsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-hotels", {
        body: { destination: itinerary.destination, budget: getVal(quizData.budget, "Comfortable"), accommodation_type: getArr(quizData.accommodation_type), currency: quizData.currency || "USD ($)" },
      });
      if (error) throw error;
      setHotels(data?.hotels || []);
    } catch (e: any) {
      console.error("Hotel search error:", e);
      if (itinerary.hotel_suggestion) {
        setHotels([
          { name: itinerary.hotel_suggestion.name, city: itinerary.hotel_suggestion.area, price: parseInt(itinerary.hotel_suggestion.estimated_price_range.replace(/[^0-9]/g, "")) || 200, rating: 4.8, room_type: itinerary.hotel_suggestion.style, image_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600" },
          { name: `${itinerary.destination.split(",")[0]} Grand Hotel`, city: itinerary.destination, price: (parseInt(itinerary.hotel_suggestion.estimated_price_range.replace(/[^0-9]/g, "")) || 200) + 80, rating: 4.6, room_type: "deluxe", image_url: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600" },
        ]);
      }
    } finally { setHotelsLoading(false); }
  };

  const bookFlight = async (flight: RealFlight) => {
    setBookingFlight(true);
    try {
      const departDate = new Date(Date.now() + 14 * 86400000);
      // Save record for the dashboard
      await supabase.from("flights").insert({
        user_id: user!.id, airline: flight.airline, flight_number: flight.flight_number,
        departure_city: flight.from, arrival_city: flight.to,
        departure_date: departDate.toISOString(),
        arrival_date: new Date(departDate.getTime() + 12 * 3600000).toISOString(),
        price: flight.price, class: flight.class,
      });
      // Open Skyscanner with prefilled search → real booking
      const fromCode = (flight.from || "").slice(0, 3).toUpperCase();
      const toCode = (flight.to || itinerary?.destination_airport || "").slice(0, 3).toUpperCase();
      const yymmdd = departDate.toISOString().slice(2, 10).replace(/-/g, "");
      const skyUrl = `https://www.skyscanner.com/transport/flights/${fromCode}/${toCode}/${yymmdd}/`;
      window.open(skyUrl, "_blank", "noopener,noreferrer");
      toast({ title: "Opening Skyscanner ✈️", description: "Complete your booking on Skyscanner. We saved this trip to your dashboard." });
    } catch (e: any) {
      toast({ title: "Booking failed", description: e.message, variant: "destructive" });
    } finally { setBookingFlight(false); }
  };

  const bookHotel = async (hotel: RealHotel) => {
    setBookingHotel(true);
    try {
      const cin = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
      const cout = new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0];
      await supabase.from("hotels").insert({
        user_id: user!.id, hotel_name: hotel.name, city: hotel.city,
        check_in: cin, check_out: cout, room_type: hotel.room_type,
        price_per_night: hotel.price, total_price: hotel.price * 7, image_url: hotel.image_url,
      });
      // Open Booking.com with prefilled search → real booking
      const dest = encodeURIComponent(`${hotel.name} ${hotel.city}`);
      const bookingUrl = `https://www.booking.com/searchresults.html?ss=${dest}&checkin=${cin}&checkout=${cout}&group_adults=2`;
      window.open(bookingUrl, "_blank", "noopener,noreferrer");
      toast({ title: "Opening Booking.com 🏨", description: "Complete your reservation on Booking.com. We saved this trip to your dashboard." });
    } catch (e: any) {
      toast({ title: "Booking failed", description: e.message, variant: "destructive" });
    } finally { setBookingHotel(false); }
  };

  // ── GENERATING / BUILDING PHASE ──
  if (phase === "generating" || phase === "building") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="h-[52px]" />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4">
          {error ? (
            <>
              <div className="w-16 h-16 bg-destructive/15 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
              <p className="text-muted-foreground text-sm text-center max-w-md">{error}</p>
              <Button onClick={() => navigate("/#quiz")} className="bg-black text-white">Try Again</Button>
            </>
          ) : (
            <>
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-accent/20 flex items-center justify-center">
                  <Globe className="w-14 h-14 text-accent animate-spin" style={{ animationDuration: "3s" }} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-black rounded-full animate-bounce flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-foreground mb-2">
                  {phase === "building" ? "Crafting Your Perfect Itinerary..." : "Finding Amazing Destinations..."}
                </h2>
                <p className="text-muted-foreground text-sm">Our AI is analyzing thousands of possibilities</p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                {(phase === "building"
                  ? ["Building day plans", "Finding flights", "Curating hotels"]
                  : ["Matching preferences", "Scoring destinations", "Creating options"]
                ).map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs gap-1.5 py-1.5 px-3">
                    <Loader2 className="w-3 h-3 animate-spin" />{s}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── CHOOSE DESTINATION PHASE ──
  if (phase === "choose") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="h-[52px]" />
        <div className="bg-card text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <Badge className="bg-accent text-black border-0 text-xs font-bold uppercase tracking-widest px-5 py-2 mb-4">
              🎯 Choose Your Adventure
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black">Pick Your Destination</h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-lg mx-auto">
              We found a perfect match for you, plus one mystery destination. Which one calls to you?
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 max-w-3xl">
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {destinations.map((dest) => (
              <Card
                key={dest.id}
                onClick={() => handleDestinationChoice(dest)}
                className={`bg-card rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${
                  selectedDest === dest.id ? "ring-2 ring-accent shadow-xl" : ""
                } ${dest.mystery ? "bg-gradient-to-b from-[#2d2d2d] to-[#1a1a1a] text-white" : ""}`}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dest.mystery ? "bg-accent/20" : "bg-accent/10"}`}>
                      {dest.mystery ? <Lock className="w-5 h-5 text-accent" /> : <Eye className="w-5 h-5 text-accent" />}
                    </div>
                    <Badge className={`text-[10px] font-bold ${dest.mystery ? "bg-accent text-black" : "bg-green-100 text-green-700 border-0"}`}>
                      {dest.match_score}% match
                    </Badge>
                  </div>

                  {/* Name */}
                  <h3 className={`text-xl font-black mb-1 ${dest.mystery ? "text-white" : "text-foreground"}`}>
                    {dest.mystery ? "🔮 Mystery Destination" : dest.name}
                  </h3>
                  <p className={`text-sm mb-4 ${dest.mystery ? "text-muted-foreground" : "text-muted-foreground"}`}>
                    {dest.tagline}
                  </p>

                  {/* Hints / Highlights */}
                  <div className="flex-1">
                    <p className={`text-[10px] uppercase tracking-wider font-bold mb-2 ${dest.mystery ? "text-accent" : "text-muted-foreground"}`}>
                      {dest.mystery ? "Cryptic Hints" : "Highlights"}
                    </p>
                    <ul className="space-y-1.5">
                      {(dest.mystery ? dest.hints : dest.highlights).map((item, i) => (
                        <li key={i} className={`text-xs flex items-start gap-2 ${dest.mystery ? "text-muted-foreground" : "text-muted-foreground"}`}>
                          {dest.mystery ? <HelpCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-accent" /> : <Check className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />}
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Budget + CTA */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className={`text-xs mb-1 ${dest.mystery ? "text-muted-foreground" : "text-muted-foreground"}`}>Estimated Budget</p>
                    <p className={`text-lg font-black ${dest.mystery ? "text-accent" : "text-foreground"}`}>
                      {dest.estimated_budget}
                    </p>
                    <p className={`text-[10px] mt-1 ${dest.mystery ? "text-muted-foreground" : "text-muted-foreground"}`}>{dest.best_for}</p>
                  </div>

                  <Button
                    className={`mt-4 w-full rounded-full font-bold text-sm py-5 ${
                      dest.mystery
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "bg-black text-black-foreground hover:bg-black/90"
                    }`}
                  >
                    {dest.mystery ? (
                      <><Sparkles className="w-4 h-4 mr-2" />Reveal Mystery</>
                    ) : (
                      <>Choose This <ChevronRight className="w-4 h-4 ml-1" /></>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!itinerary) return null;

  const currentDayPlan = itinerary.days?.find((d) => d.day === activeDay);

  // ── DESTINATION REVEAL ──
  if (phase === "destination") {
    const cityQuery = encodeURIComponent(itinerary.destination.split(",")[0].trim());
    const heroImg = `https://source.unsplash.com/1600x900/?${cityQuery},travel,landscape`;
    const hotelImg = `https://source.unsplash.com/800x600/?${cityQuery},hotel,room`;
    const foodImg = `https://source.unsplash.com/800x600/?${cityQuery},food,local`;
    // Match score: prefer AI vibe_score, fall back to chosen card score, else 90
    const matchScore = (itinerary as any).vibe_score
      || destinations.find((d) => d.id === selectedDest)?.match_score
      || 92;

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="h-[52px]" />

        {/* HERO IMAGE */}
        <div className="relative w-full h-[42vh] min-h-[300px] overflow-hidden">
          <img
            src={heroImg}
            alt={itinerary.destination}
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <Badge className="absolute top-6 left-6 bg-accent text-accent-foreground border-0 text-xs font-bold uppercase tracking-widest px-4 py-1.5">
            🎯 Your Destination
          </Badge>
        </div>

        <div className="container mx-auto px-4 -mt-20 relative z-10 flex flex-col items-center gap-6 pb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-black text-foreground text-center tracking-tight drop-shadow-lg">
            {itinerary.destination}
          </h1>
          <p className="text-muted-foreground text-center max-w-xl leading-relaxed">{itinerary.summary}</p>

          {/* Confidence indicators */}
          <div className="flex flex-wrap justify-center gap-3">
            <Badge className="bg-black/15 text-black border border-black/30 text-xs gap-1.5 py-1.5 px-3">
              <Target className="w-3.5 h-3.5" /> Matches your preferences: {matchScore}%
            </Badge>
            <Badge className="bg-green-500/15 text-green-400 border border-green-500/30 text-xs gap-1.5 py-1.5 px-3">
              <Check className="w-3.5 h-3.5" /> Within your budget
            </Badge>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="outline" className="text-sm gap-2 py-2 px-4"><Calendar className="w-4 h-4 text-accent" />{itinerary.duration}</Badge>
            <Badge variant="outline" className="text-sm gap-2 py-2 px-4"><DollarSign className="w-4 h-4 text-accent" />{itinerary.estimated_budget}</Badge>
            <Badge variant="outline" className="text-sm gap-2 py-2 px-4"><Star className="w-4 h-4 text-accent" />Best: {itinerary.best_season}</Badge>
          </div>

          {/* Visual previews — hotel + local food */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mt-4">
            <Card className="overflow-hidden bg-card border-border">
              <div className="h-36 overflow-hidden">
                <img src={hotelImg} alt="Stay preview" className="w-full h-full object-cover"
                     onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800"; }} />
              </div>
              <CardContent className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1"><Hotel className="w-3 h-3" /> Where you'll stay</p>
                <p className="text-sm font-bold text-foreground mt-1 line-clamp-1">
                  {itinerary.hotel_suggestion?.name || "Boutique stay nearby"}
                </p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden bg-card border-border">
              <div className="h-36 overflow-hidden">
                <img src={foodImg} alt="Food preview" className="w-full h-full object-cover"
                     onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"; }} />
              </div>
              <CardContent className="p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" /> What you'll taste</p>
                <p className="text-sm font-bold text-foreground mt-1 line-clamp-1">Local cuisine & hidden cafés</p>
              </CardContent>
            </Card>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-2xl">
            <Button
              onClick={exploreAnotherOption}
              disabled={exploringAlternative}
              variant="outline"
              className="rounded-full px-6 py-6 text-sm font-bold gap-2 border-2 border-black/40 text-black hover:bg-black/10"
            >
              {exploringAlternative ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Not satisfied? Explore another option
            </Button>
            <Button
              onClick={() => {
                exportItineraryPdf(itinerary, quizData);
                toast({ title: "Itinerary exported 📄", description: "Your day-wise PDF is downloading now." });
              }}
              variant="outline"
              className="rounded-full px-6 py-6 text-sm font-bold gap-2 border-2"
            >
              <Download className="w-4 h-4" /> Export PDF
            </Button>
            <Button onClick={() => setPhase("itinerary")} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8 py-6 text-sm font-bold gap-2">
              See Your Itinerary <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {previousDestinations.length > 1 && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Excluded so far: {previousDestinations.slice(0, -1).join(" · ")}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── ITINERARY PHASE ──
  if (phase === "itinerary") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="h-[52px]" />
        <div className="bg-card text-card-foreground py-10 border-b border-border">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-black text-foreground">{itinerary.destination}</h1>
            <p className="text-muted-foreground text-sm mt-1">{itinerary.duration} · {itinerary.estimated_budget}</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <h2 className="text-lg font-bold text-foreground mb-4">Your Day-by-Day Plan</h2>
          <div className="flex gap-2 flex-wrap mb-6">
            {itinerary.days?.map((day) => (
              <button key={day.day} onClick={() => setActiveDay(day.day)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeDay === day.day ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground border border-border hover:border-foreground/40"}`}>
                Day {day.day}
              </button>
            ))}
          </div>
          {currentDayPlan && (
            <Card className="bg-card rounded-2xl overflow-hidden shadow-sm mb-6 border border-border">
              <div className="bg-background-muted px-6 py-4 border-b border-border">
                <span className="text-accent text-xs uppercase tracking-wider font-bold">Day {currentDayPlan.day}</span>
                <h3 className="text-foreground font-bold">{currentDayPlan.title}</h3>
              </div>
              <CardContent className="p-6">
                {currentDayPlan.activities?.map((act, j) => {
                  const Icon = activityIcons[act.type] || MapPin;
                  const colorClass = activityTypeColors[act.type] || "bg-background text-muted-foreground border-border";
                  return (
                    <div key={j} className="flex gap-4 mb-6 last:mb-0">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{act.time}</span>
                          <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 capitalize ${colorClass}`}>{act.type}</span>
                          {act.cost_estimate && <span className="text-[10px] text-muted-foreground">{act.cost_estimate}</span>}
                          {act.hidden_gem && <Badge className="bg-purple-100 text-purple-700 border-0 text-[9px] gap-0.5 px-1.5 py-0"><Sparkles className="w-2.5 h-2.5" />Hidden Gem</Badge>}
                          {act.photo_spot && <Badge className="bg-blue-100 text-blue-700 border-0 text-[9px] gap-0.5 px-1.5 py-0"><Camera className="w-2.5 h-2.5" />📸 Photo Spot</Badge>}
                          {act.community_pick && <Badge className="bg-green-100 text-green-700 border-0 text-[9px] gap-0.5 px-1.5 py-0">🤝 Community Pick</Badge>}
                        </div>
                        <p className="font-bold text-sm text-foreground">{act.activity}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
                        {act.local_food_tip && <p className="text-xs text-orange-600 mt-1 flex items-center gap-1"><UtensilsCrossed className="w-3 h-3" />{act.local_food_tip}</p>}
                        {act.insider_tip && <p className="text-xs text-purple-600 mt-1 italic">💡 {act.insider_tip}</p>}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {itinerary.tips?.length > 0 && (
              <Card className="bg-card rounded-xl p-5">
                <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-accent" />Travel Tips</h4>
                <ul className="space-y-2">{itinerary.tips.map((tip, i) => (<li key={i} className="text-xs text-muted-foreground flex items-start gap-2"><Check className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />{tip}</li>))}</ul>
              </Card>
            )}
            {itinerary.packing_essentials && itinerary.packing_essentials.length > 0 && (
              <Card className="bg-card rounded-xl p-5">
                <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2"><Backpack className="w-4 h-4 text-accent" />Packing List</h4>
                <ul className="space-y-2">{itinerary.packing_essentials.map((item, i) => (<li key={i} className="text-xs text-muted-foreground flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />{item}</li>))}</ul>
              </Card>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => {
                exportItineraryPdf(itinerary, quizData);
                toast({ title: "Itinerary exported 📄", description: "Your day-wise PDF is downloading now." });
              }}
              variant="outline"
              className="sm:w-auto rounded-full py-6 px-6 text-base font-bold gap-2 border-2"
            >
              <Download className="w-5 h-5" /> Export PDF
            </Button>
            <Button onClick={() => { setPhase("flights"); searchFlights(); }} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full py-6 text-base font-bold gap-2">
              <Plane className="w-5 h-5" /> Find Flights to {itinerary.destination.split(",")[0]} <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── FLIGHTS PHASE ──
  if (phase === "flights") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="h-[52px]" />
        <div className="bg-card text-white py-10">
          <div className="container mx-auto px-4 text-center">
            <Plane className="w-8 h-8 mx-auto mb-2 text-accent" />
            <h1 className="text-2xl font-black">Flights to {itinerary.destination.split(",")[0]}</h1>
            <p className="text-muted-foreground text-sm mt-1">From {getVal(quizData?.departure_city, "your city")}</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          {flightsLoading ? (
            <div className="flex flex-col items-center py-20 gap-4"><Loader2 className="w-10 h-10 animate-spin text-accent" /><p className="text-muted-foreground text-sm">Searching for the best flights...</p></div>
          ) : flights.length === 0 ? (
            <Card className="p-10 text-center"><p className="text-muted-foreground mb-4">No flights found.</p><Button onClick={() => { setPhase("hotels"); searchHotels(); }} variant="outline">Skip to Hotels →</Button></Card>
          ) : (
            <div className="space-y-4">
              {flights.map((flight, i) => (
                <Card key={i} className={`bg-card rounded-xl overflow-hidden transition-all cursor-pointer ${selectedFlight === i ? "ring-2 ring-accent shadow-lg" : "hover:shadow-md"}`} onClick={() => setSelectedFlight(i)}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center"><Plane className="w-5 h-5 text-black" /></div>
                        <div><p className="font-bold text-sm">{flight.airline}</p><p className="text-[10px] text-muted-foreground">{flight.flight_number} · {flight.stops}</p></div>
                      </div>
                      <div className="flex items-center gap-4 text-center">
                        <div><p className="font-black text-lg">{flight.depart}</p><p className="text-[10px] text-muted-foreground">{flight.from}</p></div>
                        <div className="flex flex-col items-center gap-1"><span className="text-[10px] text-muted-foreground">{flight.duration}</span><div className="w-16 h-[1px] bg-border" /></div>
                        <div><p className="font-black text-lg">{flight.arrive}</p><p className="text-[10px] text-muted-foreground">{flight.to}</p></div>
                      </div>
                      <div className="text-right"><p className="text-2xl font-black">{currencySymbol}{flight.price}</p><Badge variant="outline" className="text-[10px] capitalize">{flight.class}</Badge></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex gap-3 mt-6">
                <Button disabled={selectedFlight === null || bookingFlight} onClick={() => selectedFlight !== null && bookFlight(flights[selectedFlight])} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full py-6 font-bold gap-2">
                  {bookingFlight ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{bookingFlight ? "Booking..." : "Book Selected Flight"}
                </Button>
                <Button variant="outline" onClick={() => { setPhase("hotels"); searchHotels(); }} className="rounded-full px-6 py-6 font-bold gap-2">Skip <ChevronRight className="w-4 h-4" /></Button>
              </div>
              {selectedFlight !== null && !bookingFlight && (
                <Button onClick={() => { bookFlight(flights[selectedFlight!]); setTimeout(() => { setPhase("hotels"); searchHotels(); }, 1500); }} variant="ghost" className="w-full text-sm text-muted-foreground">Book & Continue to Hotels →</Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── HOTELS PHASE ──
  if (phase === "hotels") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="h-[52px]" />
        <div className="bg-card text-white py-10">
          <div className="container mx-auto px-4 text-center"><Hotel className="w-8 h-8 mx-auto mb-2 text-accent" /><h1 className="text-2xl font-black">Hotels in {itinerary.destination.split(",")[0]}</h1></div>
        </div>
        <div className="container mx-auto px-4 py-10 max-w-3xl">
          {hotelsLoading ? (
            <div className="flex flex-col items-center py-20 gap-4"><Loader2 className="w-10 h-10 animate-spin text-accent" /><p className="text-muted-foreground text-sm">Finding the best hotels...</p></div>
          ) : hotels.length === 0 ? (
            <Card className="p-10 text-center"><p className="text-muted-foreground mb-4">No hotels found.</p><Button onClick={() => setPhase("summary")}>View Trip Summary →</Button></Card>
          ) : (
            <div className="space-y-4">
              {hotels.map((hotel, i) => (
                <Card key={i} className={`bg-card rounded-xl overflow-hidden transition-all cursor-pointer ${selectedHotel === i ? "ring-2 ring-accent shadow-lg" : "hover:shadow-md"}`} onClick={() => setSelectedHotel(i)}>
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-48 h-36 sm:h-auto"><img src={hotel.image_url} alt={hotel.name} className="w-full h-full object-cover" /></div>
                      <div className="flex-1 p-5">
                        <div className="flex justify-between items-start">
                          <div><h3 className="font-bold text-sm">{hotel.name}</h3><p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{hotel.city}</p></div>
                          <div className="text-right"><p className="text-xl font-black">{currencySymbol}{hotel.price}<span className="text-xs font-normal text-muted-foreground">/night</span></p><div className="flex items-center gap-1 justify-end mt-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-xs font-bold">{hotel.rating}</span></div></div>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize mt-2">{hotel.room_type}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex gap-3 mt-6">
                <Button disabled={selectedHotel === null || bookingHotel} onClick={async () => { if (selectedHotel !== null) { await bookHotel(hotels[selectedHotel]); setPhase("summary"); } }} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full py-6 font-bold gap-2">
                  {bookingHotel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{bookingHotel ? "Booking..." : "Book Selected Hotel"}
                </Button>
                <Button variant="outline" onClick={() => setPhase("summary")} className="rounded-full px-6 py-6 font-bold gap-2">Skip <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── SUMMARY PHASE ──
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="h-[52px]" />
      <div className="bg-card text-white py-14">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4"><Package className="w-8 h-8 text-black" /></div>
          <h1 className="text-3xl font-black mb-2">Your Trip is Ready! 🎉</h1>
          <p className="text-muted-foreground text-sm">{itinerary.destination} · {itinerary.duration}</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="space-y-4">
          <Card className="bg-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3"><MapPin className="w-5 h-5 text-accent" /><h3 className="font-bold text-sm">Destination</h3></div>
            <p className="text-xl font-black text-foreground">{itinerary.destination}</p>
            <p className="text-xs text-muted-foreground mt-1">{itinerary.duration} · Budget: {itinerary.estimated_budget}</p>
          </Card>
          {selectedFlight !== null && flights[selectedFlight] && (
            <Card className="bg-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3"><Plane className="w-5 h-5 text-accent" /><h3 className="font-bold text-sm">Flight Booked</h3><Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Confirmed</Badge></div>
              <p className="font-bold text-foreground">{flights[selectedFlight].from} → {flights[selectedFlight].to}</p>
              <p className="text-xs text-muted-foreground">{flights[selectedFlight].airline} · {flights[selectedFlight].flight_number} · {currencySymbol}{flights[selectedFlight].price}</p>
            </Card>
          )}
          {selectedHotel !== null && hotels[selectedHotel] && (
            <Card className="bg-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3"><Hotel className="w-5 h-5 text-accent" /><h3 className="font-bold text-sm">Hotel Booked</h3><Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Confirmed</Badge></div>
              <p className="font-bold text-foreground">{hotels[selectedHotel].name}</p>
              <p className="text-xs text-muted-foreground">{currencySymbol}{hotels[selectedHotel].price}/night · {hotels[selectedHotel].room_type}</p>
            </Card>
          )}
          <BudgetBreakdown flightCost={selectedFlight !== null && flights[selectedFlight] ? flights[selectedFlight].price : 0} hotelCost={selectedHotel !== null && hotels[selectedHotel] ? hotels[selectedHotel].price * 7 : 0} currencySymbol={currencySymbol} estimatedBudget={itinerary.estimated_budget} />
          <Card className="bg-accent/10 border-accent/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3"><DollarSign className="w-5 h-5 text-accent" /><h3 className="font-bold text-sm">Estimated Total</h3></div>
            <p className="text-3xl font-black text-foreground">
              {currencySymbol}{((selectedFlight !== null && flights[selectedFlight] ? flights[selectedFlight].price : 0) + (selectedHotel !== null && hotels[selectedHotel] ? hotels[selectedHotel].price * 7 : 0)).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Flight + 7 nights accommodation (activities not included)</p>
          </Card>
          <div className="flex gap-3 pt-4">
            <Button onClick={() => navigate("/dashboard")} className="flex-1 bg-card text-white hover:bg-card/80 rounded-full py-6 font-bold">Go to Dashboard</Button>
            <Button onClick={() => navigate("/#quiz")} variant="outline" className="rounded-full px-6 py-6 font-bold">Plan Another Trip</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripReveal;
