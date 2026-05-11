import { ColumnStats } from "@/lib/data-analyzer";
import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Info, ChevronRight, Hash, Type, Calendar, ToggleLeft } from "lucide-react";
import { useState } from "react";

interface ColumnInsightsProps {
  columns: ColumnStats[];
}

const typeIcons: Record<string, any> = {
  numeric: Hash,
  categorical: Type,
  datetime: Calendar,
  boolean: ToggleLeft,
  mixed: AlertTriangle,
  empty: Info,
};

const severityColors: Record<string, string> = {
  error: "text-destructive bg-destructive/10",
  warning: "text-warning bg-warning/10",
  info: "text-accent bg-accent/10",
};

export default function ColumnInsights({ columns }: ColumnInsightsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = [...columns].sort((a, b) => a.qualityScore - b.qualityScore);

  return (
    <div className="space-y-2">
      {sorted.map((col, i) => {
        const Icon = typeIcons[col.type] || Info;
        const isOpen = expanded === col.name;
        const scoreColor = col.qualityScore >= 80 ? "text-success" : col.qualityScore >= 60 ? "text-warning" : "text-destructive";

        return (
          <motion.div
            key={col.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card overflow-hidden"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : col.name)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="font-mono text-sm text-foreground flex-1 truncate">{col.name}</span>
              <span className="text-xs text-muted-foreground mr-2">{col.type}</span>
              <span className={`text-sm font-bold ${scoreColor} w-8 text-right`}>{col.qualityScore}</span>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
            </button>

            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border"
              >
                <div className="p-4 space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MiniStat label="Total" value={col.totalCount} />
                    <MiniStat label="Missing" value={`${col.missingCount} (${col.missingPercent.toFixed(1)}%)`} />
                    <MiniStat label="Unique" value={col.uniqueCount} />
                    {col.type === "numeric" && (
                      <>
                        <MiniStat label="Mean" value={col.mean?.toFixed(2) || "—"} />
                        <MiniStat label="Median" value={col.median?.toFixed(2) || "—"} />
                        <MiniStat label="Std Dev" value={col.stdDev?.toFixed(2) || "—"} />
                        <MiniStat label="Min" value={col.min?.toFixed(2) || "—"} />
                        <MiniStat label="Max" value={col.max?.toFixed(2) || "—"} />
                      </>
                    )}
                  </div>

                  {/* Top values */}
                  {col.topValues && col.topValues.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Top Values</p>
                      <div className="space-y-1">
                        {col.topValues.slice(0, 5).map((tv) => (
                          <div key={tv.value} className="flex items-center gap-2">
                            <div className="flex-1 h-5 bg-secondary rounded-sm overflow-hidden">
                              <div
                                className="h-full bg-primary/20 rounded-sm"
                                style={{ width: `${(tv.count / col.totalCount) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-foreground w-24 truncate">{tv.value}</span>
                            <span className="text-xs text-muted-foreground w-10 text-right">{tv.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issues */}
                  {col.issues.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Issues & Suggestions</p>
                      <div className="space-y-2">
                        {col.issues.map((issue, j) => (
                          <div key={j} className="flex gap-3 text-sm">
                            <div className={`p-1 rounded ${severityColors[issue.severity]}`}>
                              {issue.severity === "error" ? <AlertCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-foreground/80">{issue.description}</p>
                              <p className="text-xs text-primary mt-0.5">💡 {issue.suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-secondary/30 rounded-lg p-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-mono text-foreground mt-0.5">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}
