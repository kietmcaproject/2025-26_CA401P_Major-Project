import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-mountain.png";

const HeroSection = () => {
  const scrollToQuiz = () => {
    document.getElementById("quiz")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Mountain landscape" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/40 to-transparent" />
      </div>

      <div className="absolute top-28 left-16 z-10 text-white/40 text-5xl">☆</div>
      <div className="absolute top-28 right-16 z-10 text-white/40 text-5xl">☆</div>

      <div className="relative z-20 text-center px-4 max-w-6xl mx-auto">
        <h1 className="text-[7rem] sm:text-[10rem] md:text-[12rem] lg:text-[16rem] xl:text-[18rem] font-black leading-[0.85] tracking-tight">
          <span className="text-white drop-shadow-2xl block" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>Mystigo</span>
          <span className="text-accent drop-shadow-2xl block -mt-4 md:-mt-8" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>Go</span>
        </h1>
        <p className="text-xl md:text-2xl text-white/90 font-light mt-4 tracking-wide">Travel agency</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={scrollToQuiz} className="bg-accent text-black hover:bg-accent/90 rounded-full px-8 py-3 font-semibold text-sm">
            Book Your Mystery Trip
          </Button>
          <Button onClick={scrollToFeatures} variant="outline" className="border-white/40 text-white hover:bg-white/10 rounded-full px-8 py-3 text-sm">
            Learn More ↓
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 left-8 z-20 text-white/60 text-xs font-mono tracking-widest">23.08.2029</div>
      <div className="absolute bottom-8 right-8 z-20 text-white/60 text-xs font-mono tracking-widest">GV + UP</div>
    </section>
  );
};

export default HeroSection;
