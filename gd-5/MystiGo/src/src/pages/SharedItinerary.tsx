import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, Calendar, DollarSign, Lightbulb, Loader2,
  Camera, UtensilsCrossed, Mountain, Palmtree, Landmark,
  Star, Navigation, Clock, CheckCircle2, Backpack, Plane, Hotel,
} from "lucide-react";

const activityIcons: Record<string, React.ElementType> = {
  sightseeing: Camera, food: UtensilsCrossed, adventure: Mountain,
  relaxation: Palmtree, culture: Landmark, transport: Navigation,
};

const activityTypeColors: Record<string, string> = {
  sightseeing: "bg-blue-50 text-blue-700 border-blue-200",
  food: "bg-orange-50 text-orange-700 border-orange-200",
  adventure: "bg-green-50 text-green-700 border-green-200",
  relaxation: "bg-purple-50 text-purple-700 border-purple-200",
  culture: "bg-yellow-50 text-yellow-800 border-yellow-200",
  transport: "bg-gray-50 text-gray-600 border-gray-200",
};

const SharedItinerary = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState<any>(null);
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data } = await supabase
        .from("itineraries")
        .select("*")
        .eq("shared_token", token)
        .maybeSingle();
      if (data) {
        const plan = data.plan as any;
        setDestination(data.destination);
        setDuration(data.duration);
        setItinerary({
          summary: plan?.summary || "",
          days: plan?.days || [],
          estimated_budget: plan?.estimated_budget || "",
          best_season: plan?.best_season || "",
          tips: plan?.tips || [],
          packing_essentials: plan?.packing_essentials || [],
          flight_suggestion: plan?.flight_suggestion,
          hotel_suggestion: plan?.hotel_suggestion,
        });
      }
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <MapPin className="w-12 h-12 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Trip Not Found</h2>
        <p className="text-gray-500 text-sm">This shared link may have expired or been removed.</p>
      </div>
    );
  }

  const currentDayPlan = itinerary.days?.find((d: any) => d.day === activeDay);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared banner */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-xs font-semibold tracking-wide">
        ✈️ Shared via MystiGo — Plan your own mystery trip at{" "}
        <a href="/" className="underline">mystigo.app</a>
      </div>

      {/* Hero */}
      <div className="bg-[#2d2d2d] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full translate-x-48 -translate-y-48" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary rounded-full -translate-x-32 translate-y-32" />
        </div>
        <div className="container mx-auto px-4 py-16 text-center relative">
          <Badge className="bg-accent text-black border-0 mb-4 text-xs font-bold uppercase tracking-wider px-4 py-1.5">
            🌍 Shared Trip Itinerary
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tight">{destination}</h1>
          <p className="text-white/60 text-sm max-w-2xl mx-auto leading-relaxed">{itinerary.summary}</p>
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-full px-4 py-2">
              <Calendar className="w-4 h-4 text-accent" /><span>{duration}</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-full px-4 py-2">
              <DollarSign className="w-4 h-4 text-accent" /><span>{itinerary.estimated_budget}</span>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-full px-4 py-2">
              <Star className="w-4 h-4 text-accent" /><span>Best: {itinerary.best_season}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {itinerary.days?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Day-by-Day Plan</h2>
                <div className="flex gap-2 flex-wrap">
                  {itinerary.days.map((day: any) => (
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
                    {currentDayPlan.activities?.map((act: any, j: number) => {
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
                            </div>
                            <p className="font-bold text-sm text-gray-900">{act.activity}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{act.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {itinerary.flight_suggestion && (
              <Card className="bg-white rounded-xl shadow-sm border-0">
                <div className="bg-primary/10 px-5 py-3 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm text-gray-900">Flight Info</span>
                </div>
                <CardContent className="p-5 space-y-2 text-sm text-gray-600">
                  <p>{itinerary.flight_suggestion.from_hub} → {itinerary.flight_suggestion.to}</p>
                  <p>{itinerary.flight_suggestion.flight_duration} • {itinerary.flight_suggestion.estimated_price_range}</p>
                </CardContent>
              </Card>
            )}

            {itinerary.hotel_suggestion && (
              <Card className="bg-white rounded-xl shadow-sm border-0">
                <div className="bg-accent/10 px-5 py-3 flex items-center gap-2">
                  <Hotel className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-sm text-gray-900">Stay Info</span>
                </div>
                <CardContent className="p-5 space-y-2 text-sm text-gray-600">
                  <p className="font-semibold text-gray-900">{itinerary.hotel_suggestion.name}</p>
                  <p>{itinerary.hotel_suggestion.area} • {itinerary.hotel_suggestion.style}</p>
                  <p>{itinerary.hotel_suggestion.estimated_price_range}</p>
                </CardContent>
              </Card>
            )}

            {itinerary.tips?.length > 0 && (
              <Card className="bg-white rounded-xl shadow-sm border-0">
                <CardContent className="p-5">
                  <h3 className="font-bold text-sm flex items-center gap-2 mb-3 text-gray-900">
                    <Lightbulb className="w-4 h-4 text-accent" />Travel Tips
                  </h3>
                  <ul className="space-y-2">
                    {itinerary.tips.map((tip: string, i: number) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />{tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {itinerary.packing_essentials?.length > 0 && (
              <Card className="bg-white rounded-xl shadow-sm border-0">
                <CardContent className="p-5">
                  <h3 className="font-bold text-sm flex items-center gap-2 mb-3 text-gray-900">
                    <Backpack className="w-4 h-4 text-primary" />Packing Essentials
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {itinerary.packing_essentials.map((item: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-[10px] text-gray-600">{item}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <Card className="bg-[#2d2d2d] rounded-xl border-0 text-white shadow-sm">
              <CardContent className="p-5 text-center">
                <h3 className="font-bold text-sm mb-1">Want your own mystery trip?</h3>
                <p className="text-white/60 text-xs mb-4">Take the quiz and get a personalized itinerary</p>
                <a href="/" className="inline-block bg-accent text-black px-6 py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors">
                  Plan My Trip
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedItinerary;
