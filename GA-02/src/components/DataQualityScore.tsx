import { motion } from "framer-motion";

interface DataQualityScoreProps {
  score: number;
  breakdown: { label: string; score: number; weight: number }[];
}

export default function DataQualityScore({ score, breakdown }: DataQualityScoreProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
  const strokeColor = score >= 80 ? "hsl(160, 84%, 39%)" : score >= 60 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)";

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Data Quality Score</h3>
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
            <motion.circle
              cx="50" cy="50" r={radius}
              fill="none" stroke={strokeColor} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${color}`}>{score}</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {breakdown.map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="text-foreground font-medium">{b.score}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: b.score >= 80 ? strokeColor : b.score >= 60 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${b.score}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
