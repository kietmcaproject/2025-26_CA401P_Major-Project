import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Mountain, Umbrella, Building2, Camera, ChevronRight, Check,
  Users, User, Heart, UserCheck,
  Wallet, Gem, CreditCard, Crown,
  CalendarDays, CalendarRange, Calendar, Infinity,
  Utensils, Ship, Bike, Palette,
  Home, Hotel, TreePine, Waves,
  MapPin, Loader2, Navigation, Sparkles,
  Globe, Sun, Snowflake, CloudRain, Thermometer,
  Zap, Coffee, Gauge, Timer,
  Plane, Flag, Search, RotateCcw, MapPinOff,
  Salad, Beef, Wheat, Leaf,
  Wine, Beer, Coffee as CoffeeIcon, GlassWater,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuizStep {
  question: string;
  subtitle: string;
  key: string;
  type: "options" | "location" | "currency" | "textarea";
  multiSelect?: boolean;
  options?: { label: string; description: string; icon: React.ElementType }[];
  condition?: (answers: Record<string, string | string[]>) => boolean;
}

const allSteps: QuizStep[] = [
  {
    question: "Where are you traveling from?",
    subtitle: "We'll find the best connections from your city",
    key: "departure_city",
    type: "location",
  },
  {
    question: "Explore your own country or go abroad?",
    subtitle: "This decides the scope of your mystery destination",
    key: "travel_scope",
    type: "options",
    options: [
      { label: "Domestic", description: "Hidden gems in my own country", icon: Flag },
      { label: "International", description: "Take me to a new country!", icon: Globe },
      { label: "Surprise Me", description: "Anywhere in the world works", icon: Sparkles },
      { label: "Nearby Countries", description: "Close but different culture", icon: Plane },
    ],
  },
  {
    question: "Where have you already traveled?",
    subtitle: "We'll make sure your destination is somewhere NEW and exciting!",
    key: "visited_places",
    type: "textarea",
  },
  {
    question: "Want to revisit any favorite place?",
    subtitle: "If yes, tell us — otherwise we'll find somewhere completely new",
    key: "revisit_preference",
    type: "options",
    options: [
      { label: "No, somewhere new!", description: "I want a completely fresh experience", icon: MapPinOff },
      { label: "Yes, I'd revisit", description: "I'll mention the place in the next step", icon: RotateCcw },
    ],
  },
  {
    question: "Which place would you like to revisit?",
    subtitle: "Tell us where you'd love to go back to",
    key: "revisit_place",
    type: "textarea",
    condition: (a) => {
      const v = Array.isArray(a.revisit_preference) ? a.revisit_preference[0] : a.revisit_preference;
      return v === "Yes, I'd revisit";
    },
  },
  {
    question: "What currency do you prefer?",
    subtitle: "We'll show all prices in your preferred currency",
    key: "currency",
    type: "currency",
  },
  {
    question: "What's your budget per person?",
    subtitle: "This helps us find the perfect match",
    key: "budget",
    type: "options",
    options: [
      { label: "Budget Explorer", description: "Keep it affordable & fun", icon: Wallet },
      { label: "Comfortable", description: "Good value, nice experiences", icon: CreditCard },
      { label: "Premium", description: "Treat yourself, you deserve it", icon: Gem },
      { label: "Luxury", description: "No limits, top-tier everything", icon: Crown },
    ],
  },
  {
    question: "What's your ideal travel vibe?",
    subtitle: "Pick all that excite you — we'll blend them!",
    key: "travel_style",
    type: "options",
    multiSelect: true,
    options: [
      { label: "Adventure & Outdoors", description: "Hiking, safaris, extreme sports", icon: Mountain },
      { label: "Beach & Relaxation", description: "Sunsets, spa, zero agenda", icon: Umbrella },
      { label: "Culture & History", description: "Museums, ancient ruins, local life", icon: Building2 },
      { label: "Food & Photography", description: "Culinary scenes & scenic shots", icon: Camera },
    ],
  },
  {
    question: "What climate do you love?",
    subtitle: "Select all that appeal to you",
    key: "climate_preference",
    type: "options",
    multiSelect: true,
    options: [
      { label: "Tropical & Warm", description: "Sunshine, beaches, warm breeze", icon: Sun },
      { label: "Cold & Snowy", description: "Mountains, cozy vibes, snow", icon: Snowflake },
      { label: "Mild & Pleasant", description: "Not too hot, not too cold", icon: Thermometer },
      { label: "Rainy & Lush", description: "Green forests, monsoon magic", icon: CloudRain },
    ],
  },
  {
    question: "How do you like your travel pace?",
    subtitle: "Packed days or chill vibes?",
    key: "travel_pace",
    type: "options",
    options: [
      { label: "Action-Packed", description: "See everything, sleep later!", icon: Zap },
      { label: "Balanced", description: "Mix of activity and downtime", icon: Gauge },
      { label: "Slow & Relaxed", description: "No rushing, soak it all in", icon: Coffee },
      { label: "Flexible", description: "Some planned, some spontaneous", icon: Timer },
    ],
  },
  {
    question: "How long can you escape for?",
    subtitle: "We'll plan every single day perfectly",
    key: "trip_duration",
    type: "options",
    options: [
      { label: "Weekend Getaway", description: "2–3 days of pure magic", icon: CalendarDays },
      { label: "Short Break", description: "4–6 days to recharge", icon: Calendar },
      { label: "Full Week", description: "7–10 days of discovery", icon: CalendarRange },
      { label: "Extended Journey", description: "10+ days, go deep", icon: Infinity },
    ],
  },
  {
    question: "Who's joining the adventure?",
    subtitle: "We tailor every experience to your group",
    key: "travel_companions",
    type: "options",
    options: [
      { label: "Solo Explorer", description: "Just me, the world & freedom", icon: User },
      { label: "Romantic Escape", description: "Two hearts, one destination", icon: Heart },
      { label: "Family Fun", description: "Kids, parents, memories", icon: Users },
      { label: "Squad Goals", description: "Friends who travel together", icon: UserCheck },
    ],
  },
  {
    question: "What activities excite you most?",
    subtitle: "Pick all your favorites!",
    key: "activity_preference",
    type: "options",
    multiSelect: true,
    options: [
      { label: "Gourmet & Nightlife", description: "Restaurants, bars, local markets", icon: Utensils },
      { label: "Water & Ocean", description: "Diving, sailing, island hopping", icon: Ship },
      { label: "Cycling & Trekking", description: "Active explorations on foot", icon: Bike },
      { label: "Arts & Wellness", description: "Galleries, yoga, spas", icon: Palette },
    ],
  },
  {
    question: "Any food preferences?",
    subtitle: "We'll personalize restaurant picks & local food tips",
    key: "food_preference",
    type: "options",
    multiSelect: true,
    options: [
      { label: "No restrictions — I eat everything", description: "Surprise me with local specialties", icon: Beef },
      { label: "Vegetarian", description: "Plant-forward meals only", icon: Salad },
      { label: "Vegan", description: "100% plant-based", icon: Leaf },
      { label: "Gluten-free", description: "Avoid wheat & gluten", icon: Wheat },
    ],
  },
  {
    question: "What about beverages?",
    subtitle: "Pick all that match your vibe",
    key: "beverage_preference",
    type: "options",
    multiSelect: true,
    options: [
      { label: "Local Wine & Cocktails", description: "Vineyards, sunset cocktails, local spirits", icon: Wine },
      { label: "Craft Beer & Breweries", description: "Local craft brews & beer halls", icon: Beer },
      { label: "Specialty Coffee & Tea", description: "Hidden cafés, tea ceremonies, latte art", icon: CoffeeIcon },
      { label: "Non-alcoholic only", description: "Mocktails, juices, fresh drinks", icon: GlassWater },
    ],
  },
  {
    question: "Where do you prefer to sleep?",
    subtitle: "Pick all styles you'd enjoy",
    key: "accommodation_type",
    type: "options",
    multiSelect: true,
    condition: (a) => {
      const b = Array.isArray(a.budget) ? a.budget[0] : a.budget;
      return b === "Premium" || b === "Luxury";
    },
    options: [
      { label: "Boutique Hotel", description: "Stylish, intimate, local character", icon: Hotel },
      { label: "Eco Lodge / Glamping", description: "Nature immersion done right", icon: TreePine },
      { label: "Beach / Overwater Villa", description: "Wake up to the ocean", icon: Waves },
      { label: "City Apartment", description: "Live like a local", icon: Home },
    ],
  },
];

// Comprehensive world currencies
const allCurrencies = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  { code: "TWD", symbol: "NT$", name: "Taiwan Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "QAR", symbol: "﷼", name: "Qatari Riyal" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  { code: "BHD", symbol: "BD", name: "Bahraini Dinar" },
  { code: "OMR", symbol: "ر.ع", name: "Omani Rial" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  { code: "NPR", symbol: "रू", name: "Nepalese Rupee" },
  { code: "MMK", symbol: "K", name: "Myanmar Kyat" },
  { code: "CLP", symbol: "CL$", name: "Chilean Peso" },
  { code: "COP", symbol: "COL$", name: "Colombian Peso" },
  { code: "ARS", symbol: "AR$", name: "Argentine Peso" },
  { code: "PEN", symbol: "S/", name: "Peruvian Sol" },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia" },
  { code: "RON", symbol: "lei", name: "Romanian Leu" },
  { code: "BGN", symbol: "лв", name: "Bulgarian Lev" },
  { code: "HRK", symbol: "kn", name: "Croatian Kuna" },
  { code: "ISK", symbol: "kr", name: "Icelandic Krona" },
  { code: "JOD", symbol: "JD", name: "Jordanian Dinar" },
  { code: "MAD", symbol: "MAD", name: "Moroccan Dirham" },
  { code: "TND", symbol: "DT", name: "Tunisian Dinar" },
  { code: "GEL", symbol: "₾", name: "Georgian Lari" },
  { code: "AMD", symbol: "֏", name: "Armenian Dram" },
  { code: "UZS", symbol: "сўм", name: "Uzbek Sum" },
  { code: "KZT", symbol: "₸", name: "Kazakh Tenge" },
];

const QuizSection = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [locationDetected, setLocationDetected] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const [textareaInput, setTextareaInput] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const activeSteps = allSteps.filter(
    (step) => !step.condition || step.condition(answers)
  );

  const totalSteps = activeSteps.length;
  const currentStepData = activeSteps[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  useEffect(() => {
    if (currentStep === 0 && !locationDetected) {
      detectLocation();
    }
  }, []);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );
      const { latitude, longitude } = position.coords;
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision || "";
      const country = data.countryName || "";
      const loc = city ? `${city}, ${country}` : country;
      if (loc) {
        setLocationInput(loc);
        setLocationDetected(true);
      }
    } catch {
      // User denied or timeout
    } finally {
      setDetectingLocation(false);
    }
  }, []);

  const filteredCurrencies = allCurrencies.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.symbol.includes(currencySearch)
  );

  const toggleOption = (label: string) => {
    if (currentStepData?.multiSelect) {
      setSelected((prev) =>
        prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
      );
    } else {
      setSelected([label]);
    }
  };

  const canProceed = () => {
    if (!currentStepData) return false;
    if (currentStepData.type === "location") return locationInput.trim().length > 1;
    if (currentStepData.type === "textarea") return true; // textarea is optional
    return selected.length > 0;
  };

  const handleNext = async () => {
    const step = currentStepData;
    const value =
      step.type === "location"
        ? locationInput.trim()
        : step.type === "textarea"
        ? textareaInput.trim()
        : step.multiSelect
        ? selected
        : selected[0];
    const newAnswers = { ...answers, [step.key]: value };
    setAnswers(newAnswers);

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      setSelected([]);
      setCurrencySearch("");
      setTextareaInput("");
      // Restore textarea value if going forward to a step that already has an answer
      const nextStep = activeSteps[currentStep + 1];
      if (nextStep && nextStep.type === "textarea" && newAnswers[nextStep.key]) {
        setTextareaInput(newAnswers[nextStep.key] as string);
      }
    } else {
      if (user) {
        setSaving(true);
        try {
          const ts = Array.isArray(newAnswers.travel_style) ? newAnswers.travel_style.join(", ") : (newAnswers.travel_style as string);
          const td = Array.isArray(newAnswers.trip_duration) ? newAnswers.trip_duration[0] : (newAnswers.trip_duration as string);
          const b = Array.isArray(newAnswers.budget) ? newAnswers.budget[0] : (newAnswers.budget as string);
          const tc = Array.isArray(newAnswers.travel_companions) ? newAnswers.travel_companions[0] : (newAnswers.travel_companions as string);

          const { error } = await supabase.from("quiz_results").insert({
            user_id: user.id,
            travel_style: ts,
            trip_duration: td,
            budget: b,
            travel_companions: tc,
          });
          if (error) {
            toast({ title: "Error saving quiz", description: error.message, variant: "destructive" });
            return;
          }
          navigate("/reveal", { state: { quizData: newAnswers } });
        } catch {
          toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
        } finally {
          setSaving(false);
        }
      } else {
        toast({ title: "Sign in to continue", description: "Create a free account to reveal your mystery destination." });
        navigate("/auth");
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = activeSteps[currentStep - 1];
      setCurrentStep((prev) => prev - 1);
      const prevAnswer = answers[prevStep.key];
      if (prevStep.type === "location") {
        setSelected([]);
      } else if (prevStep.type === "textarea") {
        setTextareaInput((prevAnswer as string) || "");
        setSelected([]);
      } else if (prevAnswer) {
        setSelected(Array.isArray(prevAnswer) ? prevAnswer : [prevAnswer]);
      } else {
        setSelected([]);
      }
      setCurrencySearch("");
    }
  };

  if (!currentStepData) return null;

  return (
    <section className="bg-primary py-20" id="quiz">
      <div className="container mx-auto px-4 flex justify-center">
        <Card className="bg-white rounded-2xl shadow-xl p-8 md:p-10 w-full max-w-2xl">
          {/* Header */}
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#2d2d2d] font-semibold">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-gray-400">{Math.round(progress)}% complete</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-8">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question */}
          <div className="mb-8 text-center">
            <h3 className="text-xl md:text-2xl font-extrabold text-[#2d2d2d] mb-1">
              {currentStepData.question}
            </h3>
            <p className="text-sm text-gray-400">{currentStepData.subtitle}</p>
            {currentStepData.multiSelect && (
              <span className="inline-block mt-2 text-xs bg-accent/10 text-accent font-semibold px-3 py-1 rounded-full">
                ✨ Select multiple
              </span>
            )}
          </div>

          {/* Location Step */}
          {currentStepData.type === "location" && (
            <div className="mb-8 space-y-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Enter your city..."
                  className="pl-10 text-base h-14 rounded-xl border-2 border-gray-200 focus:border-[#2d2d2d]"
                />
              </div>
              {detectingLocation ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Detecting your location...
                </div>
              ) : !locationDetected ? (
                <button
                  onClick={detectLocation}
                  className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors mx-auto font-medium"
                >
                  <Navigation className="w-4 h-4" />
                  Use my current location
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-green-600 justify-center">
                  <Check className="w-4 h-4" />
                  Location detected automatically
                </div>
              )}
            </div>
          )}

          {/* Textarea Step */}
          {currentStepData.type === "textarea" && (
            <div className="mb-8 space-y-3">
              <Textarea
                value={textareaInput}
                onChange={(e) => setTextareaInput(e.target.value)}
                placeholder={
                  currentStepData.key === "visited_places"
                    ? "e.g. Paris, Tokyo, Bali, New York, Dubai... (leave empty if this is your first trip!)"
                    : "e.g. Bali — I loved the beaches and culture there"
                }
                className="text-sm min-h-[100px] rounded-xl border-2 border-gray-200 focus:border-[#2d2d2d] resize-none"
              />
              {currentStepData.key === "visited_places" && (
                <p className="text-xs text-gray-400 text-center">
                  💡 This helps us suggest places you haven't been to yet
                </p>
              )}
            </div>
          )}

          {/* Currency Step */}
          {currentStepData.type === "currency" && (
            <div className="mb-8 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={currencySearch}
                  onChange={(e) => setCurrencySearch(e.target.value)}
                  placeholder="Search currency (e.g. INR, Dollar, Euro)..."
                  className="pl-10 text-sm h-11 rounded-xl border-2 border-gray-200 focus:border-[#2d2d2d]"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
                {filteredCurrencies.map((curr) => {
                  const label = `${curr.code} (${curr.symbol})`;
                  const isSelected = selected.includes(label);
                  return (
                    <button
                      key={curr.code}
                      onClick={() => setSelected([label])}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? "border-[#2d2d2d] bg-[#2d2d2d]/5 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <span className={`text-xl font-black ${isSelected ? "text-[#2d2d2d]" : "text-gray-600"}`}>
                        {curr.symbol}
                      </span>
                      <span className={`text-[10px] font-semibold ${isSelected ? "text-[#2d2d2d]" : "text-gray-500"}`}>
                        {curr.code}
                      </span>
                      <span className="text-[9px] text-gray-400 truncate w-full text-center">{curr.name}</span>
                      {isSelected && (
                        <div className="w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-black" />
                        </div>
                      )}
                    </button>
                  );
                })}
                {filteredCurrencies.length === 0 && (
                  <p className="col-span-4 text-center text-sm text-gray-400 py-6">No currency found</p>
                )}
              </div>
            </div>
          )}

          {/* Options Step */}
          {currentStepData.type === "options" && currentStepData.options && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {currentStepData.options.map((option) => {
                const Icon = option.icon;
                const isSelected = selected.includes(option.label);
                return (
                  <button
                    key={option.label}
                    onClick={() => toggleOption(option.label)}
                    className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-200 text-left group ${
                      isSelected
                        ? "border-[#2d2d2d] bg-[#2d2d2d]/5 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? "bg-accent" : "bg-white border border-gray-200"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-black" : "text-gray-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${isSelected ? "text-[#2d2d2d]" : "text-gray-800"}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{option.description}</p>
                    </div>
                    {isSelected && (
                      <div className="ml-auto flex-shrink-0">
                        <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-black" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            <Button
              onClick={handleNext}
              disabled={!canProceed() || saving}
              className="bg-accent text-black hover:bg-accent/90 rounded-full px-8 py-3 font-bold text-sm disabled:opacity-40 ml-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : currentStep === totalSteps - 1 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Reveal My Trip
                </>
              ) : (
                "Next →"
              )}
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default QuizSection;
