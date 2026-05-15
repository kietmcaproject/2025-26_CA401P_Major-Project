import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";

const resorts = [
  { name: "Soneva Jani", price: "$1,500/night", image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400" },
  { name: "Conrad Maldives", price: "$1,200/night", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=400" },
  { name: "Kuredu Island Resort", price: "$420/night", image: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400" },
  { name: "Fihalhohi Island Resort", price: "$290/night", image: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=400" },
];

const ResortCardsSection = () => {
  const scrollToBooking = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-gray-400 text-xs uppercase tracking-widest">SPECIAL OFFERS</span>
          <h2 className="text-3xl md:text-4xl font-bold text-black mt-2 mb-6">
            Where comfort<br />meets adventure
          </h2>
          <div className="flex justify-center gap-2 mb-8">
            <Badge className="bg-red-500 text-white border-0 text-xs rounded-sm px-3 py-1">Maldives</Badge>
            <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs rounded-sm px-3 py-1">China</Badge>
            <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs rounded-sm px-3 py-1">Chile</Badge>
            <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs rounded-sm px-3 py-1">Sri Lanka</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {resorts.map((resort, index) => (
            <Card key={index} onClick={scrollToBooking} className="overflow-hidden group cursor-pointer border-0 shadow-md rounded-xl">
              <div className="relative h-48 md:h-56">
                <img
                  src={resort.image}
                  alt={resort.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-3 right-3 p-1.5 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/40 transition-colors"
                >
                  <Heart className="w-3.5 h-3.5 text-white" />
                </button>
                <div className="absolute bottom-3 left-3">
                  <h3 className="text-white font-semibold text-sm">{resort.name}</h3>
                  <p className="text-white/80 text-xs">{resort.price}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button onClick={scrollToBooking} className="bg-accent text-black hover:bg-accent/90 rounded-full px-8 text-sm font-semibold">
            Show all
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ResortCardsSection;
