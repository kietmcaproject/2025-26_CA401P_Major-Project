import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane } from "lucide-react";

const DestinationsSection = () => {
  const scrollToBooking = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="destinations" className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">Mystery Destinations</h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Explore our global network of surprise destinations. We've sent travelers to amazing places across 85+ countries!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Map Card */}
          <Card onClick={scrollToBooking} className="bg-gray-50 border-0 rounded-2xl p-8 flex flex-col justify-center items-center min-h-[280px] cursor-pointer hover:shadow-lg transition-shadow">
            <div className="relative w-full flex justify-center mb-6">
              <div className="relative w-48 h-32">
                <div className="absolute left-0 bottom-0 w-12 h-12 bg-red-400 rounded-full opacity-80 hover:opacity-100 transition-opacity" />
                <div className="absolute left-16 top-2 w-10 h-14 bg-accent rounded-[40%] opacity-90 hover:opacity-100 transition-opacity" />
                <div className="absolute left-24 top-0 w-16 h-20 bg-accent rounded-[40%] opacity-80 hover:opacity-100 transition-opacity" />
                <div className="absolute right-2 top-4 w-12 h-16 bg-green-500 rounded-[40%] opacity-70 hover:opacity-100 transition-opacity" />
                <div className="absolute right-0 bottom-0 w-8 h-8 bg-green-400 rounded-full opacity-60 hover:opacity-100 transition-opacity" />
                <div className="absolute left-8 top-8 w-6 h-6 bg-orange-400 rounded-full opacity-70 hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="text-left w-full">
              <h3 className="text-sm font-bold text-black">Mystery Destinations</h3>
              <p className="text-xs text-gray-400">Click to start your mystery trip</p>
            </div>
          </Card>

          {/* Stats Card */}
          <Card className="bg-gray-50 border-0 rounded-2xl p-8 flex flex-col justify-center">
            <div className="flex justify-center mb-6">
              <Plane className="w-8 h-8 text-gray-800" />
            </div>
            <h3 className="text-black font-bold text-sm text-center mb-2">Discover the World</h3>
            <p className="text-gray-400 text-xs text-center mb-6">
              Click on any region to see our mystery destinations and popular surprise locations.
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Total Destinations</span>
                <span className="text-xs font-bold text-black">85+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Countries Covered</span>
                <span className="text-xs font-bold text-black">30+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Mystery Trips Sent</span>
                <span className="text-xs font-bold text-black">10,000+</span>
              </div>
            </div>
            <Button onClick={scrollToBooking} className="mt-6 bg-black text-white hover:bg-black/90 rounded-lg text-xs font-semibold">
              Start Your Mystery Trip
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DestinationsSection;
