import { Card } from "@/components/ui/card";

const stats = [
  { value: "300+", label: "CURATED TRAVEL\nEXPERIENCES" },
  { value: "98%", label: "CLIENT\nSATISFACTION" },
  { value: "40%", label: "SAVINGS WITH\nEARLY BOOKING" },
];

const StatsSection = () => {
  return (
    <section className="py-16 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600")' }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <div className="flex justify-center">
          <div className="inline-flex bg-accent rounded-xl overflow-hidden">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`px-8 md:px-12 py-6 text-center ${index < stats.length - 1 ? 'border-r border-black/10' : ''}`}
              >
                <div className="text-4xl md:text-5xl lg:text-6xl font-black text-black mb-1">{stat.value}</div>
                <div className="text-black/70 font-medium text-[10px] md:text-xs uppercase tracking-wide whitespace-pre-line leading-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
