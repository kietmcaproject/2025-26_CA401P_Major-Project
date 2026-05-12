import { useEffect, useState } from "react";

const STAGES = [
  { label: "Decoding your travel DNA", emoji: "🧬" },
  { label: "Scanning hidden corners of the world", emoji: "🌍" },
  { label: "Cross-referencing local secrets", emoji: "🔑" },
  { label: "Unlocking your coordinates", emoji: "📍" },
  { label: "Finalising the magic", emoji: "✨" },
];

interface Props {
  message?: string;
}

const SuspenseReveal = ({ message }: Props) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 px-4 bg-gradient-to-b from-background to-muted">
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-accent/15 flex items-center justify-center reveal-shimmer overflow-hidden">
          <div className="w-24 h-24 rounded-full bg-accent/30 flex items-center justify-center text-5xl">
            {STAGES[stage].emoji}
          </div>
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-accent/40 animate-ping" />
      </div>

      <div className="text-center max-w-md">
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-bold mb-3">Mystigo Engine</p>
        <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">
          {message || "Crafting Something Special..."}
        </h2>

        <div className="space-y-2 mt-6">
          {STAGES.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                i === stage
                  ? "text-foreground font-semibold scale-105"
                  : i < stage
                  ? "text-muted-foreground/60 line-through"
                  : "text-muted-foreground/40"
              }`}
            >
              <span className="w-6 text-center">{i < stage ? "✓" : i === stage ? "○" : "·"}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground/60 italic">This is worth the wait — promise.</p>
    </div>
  );
};

export default SuspenseReveal;
