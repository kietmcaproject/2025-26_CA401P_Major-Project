import { Card } from "@/components/ui/card";
import { MapPin, Calendar, Gift } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    number: "01",
    title: "Tell Us Your Preferences",
    description: "Share your budget, travel dates, and adventure style. Our AI analyzes your preferences to craft the perfect mystery.",
  },
  {
    icon: Calendar,
    number: "02",
    title: "We Plan Your Mystery",
    description: "Our travel experts design a personalized surprise trip based on your preferences, handling all bookings and arrangements.",
  },
  {
    icon: Gift,
    number: "03",
    title: "Discover Your Destination",
    description: "Receive your mystery travel package and embark on an unforgettable adventure to your surprise destination.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="features" className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">How It Works</h2>
          <p className="text-gray-500 text-sm">Three simple steps to your next mystery adventure</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {steps.map((step) => (
            <Card key={step.number} className="bg-gray-50 border-0 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <step.icon className="w-8 h-8 text-black" />
              </div>
              <div className="text-3xl font-black text-gray-200 mb-3">{step.number}</div>
              <h3 className="text-sm font-bold text-black mb-2">{step.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
