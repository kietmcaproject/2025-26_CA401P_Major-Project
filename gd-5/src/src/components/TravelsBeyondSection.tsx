import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import heroImage from "@/assets/hero-travel.jpg";

const TravelsBeyondSection = () => {
  return (
    <section id="about" className="flex flex-col lg:flex-row min-h-screen">
      {/* Left Side - Travels Beyond */}
      <div className="w-full lg:w-1/2 bg-black relative overflow-hidden">
        <img
          src={heroImage}
          alt="Adventure landscape"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 h-full flex flex-col justify-center p-8 lg:p-16">
          <div className="max-w-md">
            <div className="mb-6">
              <span className="text-white/60 text-xs uppercase tracking-widest">Now booking</span>
              <div className="flex gap-2 mt-3">
                {["Bali", "UAE", "Thailand", "Greece"].map((place) => (
                  <Badge key={place} className="bg-accent text-black border-0 text-xs font-semibold rounded-sm px-3 py-1">
                    {place}
                  </Badge>
                ))}
              </div>
            </div>

            <p className="text-white/70 text-sm mb-8 leading-relaxed">
              Travels we curated will lead you to the perfect wonderland in perfect harmony. Let your curiosity lead you to new heights where unforgettable experiences and breathtaking places await.
            </p>

            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-8">
              TRAVELS<br />
              BEYOND<br />
              THE ORDINARY
            </h2>

            <Button onClick={() => document.getElementById("destinations")?.scrollIntoView({ behavior: "smooth" })} className="bg-transparent border border-white/40 text-white hover:bg-white hover:text-black transition-all duration-300 px-6 py-2 rounded-sm text-sm">
              Explore now <span className="ml-2">→</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side - Destination Cards */}
      <div className="w-full lg:w-1/2 bg-black p-4 lg:p-6">
        <div className="space-y-4">
          {/* Dubai Card */}
          <Card className="bg-black border-0 overflow-hidden group cursor-pointer rounded-xl">
            <div className="relative h-56 lg:h-64">
              <img
                src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800"
                alt="Dubai"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-xl"
              />
              <div className="absolute top-4 left-4">
                <span className="text-white/70 text-xs">from</span>
                <span className="text-white text-sm font-bold ml-1">$1,129</span>
              </div>
              <div className="absolute top-4 right-4">
                <h3 className="text-white text-lg font-bold">Dubai</h3>
              </div>
              <div className="absolute bottom-4 left-4 text-white/70 text-xs">
                4 nights, 2 adults
              </div>
            </div>
          </Card>

          {/* France Card */}
          <Card className="bg-black border-0 overflow-hidden group cursor-pointer rounded-xl">
            <div className="relative h-56 lg:h-64">
              <img
                src="https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800&auto=format&fit=crop"
                alt="France"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-xl"
              />
              <div className="absolute top-4 left-4">
                <span className="text-white/70 text-xs">from</span>
                <span className="text-white text-sm font-bold ml-1">$1,800</span>
              </div>
              <div className="absolute top-4 right-4">
                <h3 className="text-white text-lg font-bold">France</h3>
              </div>
              <div className="absolute bottom-4 left-4 text-white/70 text-xs">
                7 nights, 2 adults
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TravelsBeyondSection;
