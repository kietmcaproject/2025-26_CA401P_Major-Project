import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Plane, ArrowRight, Clock, Star, CheckCircle, Map } from "lucide-react";
import Header from "@/components/Header";

const sampleFlights = [
  { airline: "MystiGo Air", flight: "MG-101", from: "New York (JFK)", to: "Bali (DPS)", depart: "08:00", arrive: "18:30", duration: "22h 30m", price: 899, class: "economy", stops: "1 stop", rating: 4.8, destinations: ["bali", "indonesia"] },
  { airline: "MystiGo Air", flight: "MG-205", from: "London (LHR)", to: "Tokyo (NRT)", depart: "10:15", arrive: "06:45", duration: "11h 30m", price: 1249, class: "business", stops: "Direct", rating: 4.9, destinations: ["tokyo", "japan"] },
  { airline: "MystiGo Air", flight: "MG-310", from: "Dubai (DXB)", to: "Santorini (JTR)", depart: "14:00", arrive: "18:00", duration: "5h", price: 599, class: "economy", stops: "Direct", rating: 4.7, destinations: ["santorini", "greece"] },
  { airline: "MystiGo Air", flight: "MG-422", from: "Paris (CDG)", to: "Marrakech (RAK)", depart: "09:30", arrive: "12:00", duration: "3h 30m", price: 349, class: "economy", stops: "Direct", rating: 4.6, destinations: ["marrakech", "morocco"] },
  { airline: "MystiGo Air", flight: "MG-550", from: "Sydney (SYD)", to: "Maldives (MLE)", depart: "22:00", arrive: "05:30", duration: "10h 30m", price: 1599, class: "first", stops: "1 stop", rating: 5.0, destinations: ["maldives"] },
  { airline: "MystiGo Air", flight: "MG-618", from: "Los Angeles (LAX)", to: "Barcelona (BCN)", depart: "16:00", arrive: "11:30", duration: "11h 30m", price: 749, class: "economy", stops: "Direct", rating: 4.5, destinations: ["barcelona", "spain"] },
  { airline: "MystiGo Air", flight: "MG-720", from: "New York (JFK)", to: "Amalfi (NAP)", depart: "19:00", arrive: "09:00+1", duration: "9h", price: 849, class: "business", stops: "Direct", rating: 4.8, destinations: ["amalfi", "italy", "naples"] },
  { airline: "MystiGo Air", flight: "MG-830", from: "London (LHR)", to: "Bali (DPS)", depart: "23:00", arrive: "22:00+1", duration: "16h", price: 980, class: "economy", stops: "1 stop", rating: 4.6, destinations: ["bali", "indonesia"] },
];

const FlightBooking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState(searchParams.get("destination") || "");
  const [travelDate, setTravelDate] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [booking, setBooking] = useState<number | null>(null);
  const [bookedFlights, setBookedFlights] = useState<Set<number>>(new Set());

  const destParam = searchParams.get("destination");

  const filtered = sampleFlights.filter(f => {
    const matchFrom = !searchFrom || f.from.toLowerCase().includes(searchFrom.toLowerCase());
    const matchTo = !searchTo || f.to.toLowerCase().includes(searchTo.toLowerCase()) ||
      f.destinations.some(d => searchTo.toLowerCase().includes(d) || d.includes(searchTo.toLowerCase()));
    const matchClass = classFilter === "all" || f.class === classFilter;
    return matchFrom && matchTo && matchClass;
  });

  const bookFlight = async (flight: typeof sampleFlights[0], index: number) => {
    if (!user) { toast({ title: "Sign in required" }); navigate("/auth"); return; }
    setBooking(index);
    try {
      const departDate = travelDate ? new Date(travelDate) : new Date(Date.now() + 7 * 86400000);
      const arriveDate = new Date(departDate.getTime() + 8 * 3600000);
      const { error } = await supabase.from("flights").insert({
        user_id: user.id,
        airline: flight.airline,
        flight_number: flight.flight,
        departure_city: flight.from,
        arrival_city: flight.to,
        departure_date: departDate.toISOString(),
        arrival_date: arriveDate.toISOString(),
        price: flight.price,
        class: flight.class,
      });
      if (error) throw error;
      setBookedFlights(prev => new Set(prev).add(index));
      // Open Skyscanner with prefilled origin → destination → real booking
      const fromMatch = flight.from.match(/\(([A-Z]{3})\)/);
      const toMatch = flight.to.match(/\(([A-Z]{3})\)/);
      const fromCode = fromMatch ? fromMatch[1] : flight.from.slice(0, 3).toUpperCase();
      const toCode = toMatch ? toMatch[1] : flight.to.slice(0, 3).toUpperCase();
      const yymmdd = departDate.toISOString().slice(2, 10).replace(/-/g, "");
      const skyUrl = `https://www.skyscanner.com/transport/flights/${fromCode}/${toCode}/${yymmdd}/`;
      window.open(skyUrl, "_blank", "noopener,noreferrer");
      toast({ title: "Opening Skyscanner ✈️", description: `Complete booking for ${flight.from} → ${flight.to}. We saved it to your dashboard.` });
    } catch (e: any) {
      toast({ title: "Booking failed", description: e.message, variant: "destructive" });
    } finally { setBooking(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="h-[52px]" />
      
      {/* Hero */}
      <div className="bg-[#2d2d2d] text-white py-14">
        <div className="container mx-auto px-4 text-center">
          <Plane className="w-10 h-10 mx-auto mb-4 text-accent" />
          <h1 className="text-3xl md:text-4xl font-black mb-2">Book Your Flight</h1>
          <p className="text-white/60 text-sm">
            {destParam ? `Showing flights to ${destParam} and popular destinations` : "Browse mystery flights to incredible destinations"}
          </p>
          {destParam && (
            <Badge className="mt-3 bg-accent text-black font-bold px-4 py-1.5">
              🎯 Destination: {destParam}
            </Badge>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6">
        {/* Search Bar */}
        <Card className="bg-white shadow-xl rounded-2xl mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">From</Label>
                <Input placeholder="Departure city" value={searchFrom} onChange={e => setSearchFrom(e.target.value)} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">To (Destination)</Label>
                <Input placeholder="Destination" value={searchTo} onChange={e => setSearchTo(e.target.value)} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Departure Date</Label>
                <Input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)} className="text-sm" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Class</Label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="first">First Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <p className="text-sm text-gray-500 mb-4">{filtered.length} flight{filtered.length !== 1 ? "s" : ""} found</p>

        <div className="space-y-4 pb-16">
          {filtered.length === 0 ? (
            <Card className="bg-white rounded-xl p-12 text-center">
              <Map className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">No flights found</p>
              <p className="text-sm text-gray-400 mb-4">Try a different destination or clear the filter</p>
              <Button onClick={() => setSearchTo("")} variant="outline" size="sm">Show All Flights</Button>
            </Card>
          ) : filtered.map((flight, i) => (
            <Card key={i} className={`bg-white transition-all rounded-xl overflow-hidden ${bookedFlights.has(i) ? "border-green-200 bg-green-50/30" : "hover:shadow-lg"}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Airline */}
                  <div className="flex items-center gap-3 w-36 flex-shrink-0">
                    <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center">
                      <Plane className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-gray-900">{flight.airline}</p>
                      <p className="text-[10px] text-gray-400">{flight.flight}</p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-4 flex-1 justify-center">
                    <div className="text-center">
                      <p className="font-black text-xl text-gray-900">{flight.depart}</p>
                      <p className="text-xs text-gray-500">{flight.from.split("(")[0].trim()}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{flight.duration}</p>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-black" />
                        <div className="w-16 md:w-24 h-[1px] bg-gray-200" />
                        <ArrowRight className="w-3 h-3 text-black" />
                      </div>
                      <Badge variant="outline" className="text-[9px] px-2">{flight.stops}</Badge>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-xl text-gray-900">{flight.arrive}</p>
                      <p className="text-xs text-gray-500">{flight.to.split("(")[0].trim()}</p>
                    </div>
                  </div>

                  {/* Ratings + Price + CTA */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold">{flight.rating}</span>
                      </div>
                      <Badge className="text-[10px] capitalize" variant="outline">{flight.class}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-gray-900">${flight.price}</p>
                      <p className="text-[10px] text-gray-400 mb-1">per person</p>
                      {bookedFlights.has(i) ? (
                        <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                          <CheckCircle className="w-4 h-4" /> Booked!
                        </div>
                      ) : (
                        <Button
                          onClick={() => bookFlight(flight, i)}
                          disabled={booking === i}
                          size="sm"
                          className="bg-accent text-black hover:bg-accent/90 text-xs font-bold rounded-lg"
                        >
                          {booking === i ? "Booking..." : "Book Now"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlightBooking;
