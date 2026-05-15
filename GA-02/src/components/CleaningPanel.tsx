import { CleaningAction } from "@/lib/data-cleaner";
import { motion } from "framer-motion";
import { Sparkles, Trash2, AlertTriangle, Type, ArrowUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CleaningPanelProps {
  actions: CleaningAction[];
  onToggleAction: (id: string) => void;
  onApply: () => void;
  isApplied: boolean;
  result?: { actionsApplied: string[]; rowsRemoved: number; cellsModified: number };
}

const categoryIcons: Record<string, any> = {
  missing: AlertTriangle,
  duplicates: Trash2,
  outliers: ArrowUpDown,
  formatting: Type,
  types: AlertTriangle,
};

const impactColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-accent/10 text-accent",
};

export default function CleaningPanel({ actions, onToggleAction, onApply, isApplied, result }: CleaningPanelProps) {
  const enabledCount = actions.filter((a) => a.enabled).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Cleaning Actions</h3>
          <p className="text-sm text-muted-foreground">
            {enabledCount} of {actions.length} actions selected
          </p>
        </div>
        <Button
          onClick={onApply}
          disabled={enabledCount === 0 || isApplied}
          className="gap-2"
        >
          {isApplied ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {isApplied ? "Applied" : "Auto Clean Dataset"}
        </Button>
      </div>

      {/* Result summary */}
      {isApplied && result && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 glow-primary"
        >
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">Cleaning Complete</span>
          </div>
          <p className="text-sm text-foreground/80">
            Applied {result.actionsApplied.length} actions · Removed {result.rowsRemoved} rows · Modified {result.cellsModified} cells
          </p>
        </motion.div>
      )}

      {/* Actions list */}
      <div className="space-y-2">
        {actions.map((action, i) => {
          const Icon = categoryIcons[action.category] || AlertTriangle;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`glass-card p-4 flex items-start gap-3 cursor-pointer transition-all ${
                action.enabled ? "border-primary/30" : "opacity-60"
              } ${isApplied ? "pointer-events-none" : ""}`}
              onClick={() => onToggleAction(action.id)}
            >
              <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                action.enabled ? "bg-primary border-primary" : "border-border"
              }`}>
                {action.enabled && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${impactColors[action.impact]}`}>
                    {action.impact}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>

              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {action.affectedRows.toLocaleString()} rows
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
