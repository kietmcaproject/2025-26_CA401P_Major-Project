import { Button } from "@/components/ui/button";
import { Compass, Mountain, Plane } from "lucide-react";

const CTASection = () => {
  const scrollToQuiz = () => {
    document.getElementById("quiz")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-[#2d2d2d] py-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="flex justify-center gap-3 mb-4">
            <Compass className="w-5 h-5 text-white/60" />
            <Mountain className="w-5 h-5 text-white/60" />
            <Plane className="w-5 h-5 text-white/60" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Ready for Your Mystery Adventure?
          </h2>
          <p className="text-white/60 text-sm mb-8 max-w-lg mx-auto">
            Let us surprise you with an incredible destination from our global collection!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={scrollToQuiz} className="bg-accent text-black hover:bg-accent/90 rounded-full px-8 py-3 font-semibold text-sm">
              Start Your Journey
            </Button>
            <Button onClick={() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth" })} variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-3 text-sm">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
