import { DatasetAnalysis } from "@/lib/data-analyzer";
import { Rows3, Columns3, AlertTriangle, Copy, Database } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import DataQualityScore from "./DataQualityScore";

interface DataOverviewProps {
  analysis: DatasetAnalysis;
  fileName: string;
}

const StatCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-4"
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-2xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </motion.div>
);

export default function DataOverview({ analysis, fileName }: DataOverviewProps) {
  const totalIssues = analysis.columns.reduce((acc, c) => acc + c.issues.length, 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Rows3} label="Rows" value={analysis.rowCount} />
        <StatCard icon={Columns3} label="Columns" value={analysis.columnCount} />
        <StatCard icon={Copy} label="Duplicates" value={analysis.duplicateRowCount} sub={`${((analysis.duplicateRowCount / analysis.rowCount) * 100).toFixed(1)}% of rows`} />
        <StatCard icon={AlertTriangle} label="Issues" value={totalIssues} sub={`${analysis.missingPercent.toFixed(1)}% missing cells`} />
      </div>

      {/* Quality Score + Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <DataQualityScore score={analysis.qualityScore} breakdown={analysis.qualityBreakdown} />
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Dataset Summary</h3>
          </div>
          <div className="text-sm text-foreground/80 leading-relaxed prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{analysis.summary}</ReactMarkdown>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Source: {fileName}
          </div>
        </div>
      </div>

      {/* Column Types Overview */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Column Types</h3>
        <div className="flex flex-wrap gap-2">
          {analysis.columns.map((col) => {
            const typeColors: Record<string, string> = {
              numeric: "bg-accent/10 text-accent border-accent/20",
              categorical: "bg-primary/10 text-primary border-primary/20",
              datetime: "bg-purple-500/10 text-purple-400 border-purple-500/20",
              boolean: "bg-warning/10 text-warning border-warning/20",
              mixed: "bg-destructive/10 text-destructive border-destructive/20",
              empty: "bg-muted text-muted-foreground border-border",
            };
            return (
              <div
                key={col.name}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${typeColors[col.type] || typeColors.empty}`}
              >
                {col.name}
                <span className="ml-1.5 opacity-60">{col.type}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
