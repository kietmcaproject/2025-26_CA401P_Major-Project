import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter,
  Legend, Cell,
} from "recharts";
import { BrainCircuit, Cpu, Target, TrendingUp, BarChart2, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { runMLModels, MLRunResult, ModelResult } from "@/lib/ml-engine";
import { Badge } from "@/components/ui/badge";

interface Props {
  data: Record<string, any>[];
}

const MODEL_COLORS = [
  "hsl(160, 84%, 39%)",
  "hsl(210, 100%, 55%)",
  "hsl(280, 65%, 60%)",
  "hsl(38, 92%, 50%)",
];

const fmt = (v: number | undefined, decimals = 3) =>
  v === undefined ? "—" : v.toFixed(decimals);

const pct = (v: number | undefined) =>
  v === undefined ? "—" : `${(v * 100).toFixed(1)}%`;

function MetricCard({ label, value, sub, good }: { label: string; value: string; sub?: string; good?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col gap-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <h3 className="text-2xl font-bold mt-1 tabular-nums">{value}</h3>
      {sub && (
        <p className={`text-xs mt-1 ${good === true ? "text-green-500" : good === false ? "text-yellow-500" : "text-muted-foreground"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

function ModelCard({
  model, color, isClassification, selected, onSelect,
}: {
  model: ModelResult;
  color: string;
  isClassification: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border p-5 shadow-sm transition-all ${
        selected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-sm">{model.name}</span>
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
      </div>
      {isClassification ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><p className="text-muted-foreground">Accuracy</p><p className="font-bold text-base">{pct(model.accuracy)}</p></div>
          <div><p className="text-muted-foreground">F1 Score</p><p className="font-bold text-base">{pct(model.f1)}</p></div>
          <div><p className="text-muted-foreground">Precision</p><p className="font-bold">{pct(model.precision)}</p></div>
          <div><p className="text-muted-foreground">Recall</p><p className="font-bold">{pct(model.recall)}</p></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><p className="text-muted-foreground">R²</p><p className="font-bold text-base">{fmt(model.r2)}</p></div>
          <div><p className="text-muted-foreground">RMSE</p><p className="font-bold text-base">{fmt(model.rmse)}</p></div>
          <div><p className="text-muted-foreground">MAE</p><p className="font-bold">{fmt(model.mae)}</p></div>
          <div><p className="text-muted-foreground">MSE</p><p className="font-bold">{fmt(model.mse)}</p></div>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-3">{model.durationMs.toFixed(1)} ms</p>
    </button>
  );
}

function ConfusionMatrix({ model }: { model: ModelResult }) {
  if (!model.confusionMatrix || !model.classes) return null;
  const cm = model.confusionMatrix;
  const cls = model.classes;
  const rowMax = cm.map(row => Math.max(...row));
  return (
    <div>
      <h4 className="text-sm font-semibold mb-3">Confusion Matrix</h4>
      <div className="overflow-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-muted-foreground text-right pr-3">Actual ↓ / Pred →</th>
              {cls.map(c => (
                <th key={c} className="p-2 text-center font-medium text-muted-foreground min-w-[40px]">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cm.map((row, i) => (
              <tr key={i}>
                <td className="p-1 pr-3 text-right font-medium text-muted-foreground">{cls[i]}</td>
                {row.map((val, j) => {
                  const intensity = rowMax[i] > 0 ? val / rowMax[i] : 0;
                  const bg = i === j
                    ? `rgba(34,197,94,${0.1 + intensity * 0.5})`
                    : val > 0 ? `rgba(239,68,68,${0.05 + intensity * 0.3})` : "transparent";
                  return (
                    <td key={j} className="p-2 text-center font-mono rounded" style={{ background: bg, minWidth: 40 }}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const MLResults: React.FC<Props> = ({ data }) => {
  const result: MLRunResult | null = useMemo(() => {
    try { return runMLModels(data); } catch { return null; }
  }, [data]);

  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Not enough data for ML analysis</h3>
        <p className="text-muted-foreground text-sm">
          Please upload a dataset with at least 20 rows and 2 numeric columns,
          then apply cleaning &amp; preprocessing before running ML models.
        </p>
      </div>
    );
  }

  const { task, targetColumn, featureColumns, models, trainSize, testSize } = result;
  const isClassification = task === "classification";
  const selected = models[selectedIdx];

  const best = isClassification
    ? models.reduce((a, b) => (b.f1 ?? 0) > (a.f1 ?? 0) ? b : a)
    : models.reduce((a, b) => (b.r2 ?? -Infinity) > (a.r2 ?? -Infinity) ? b : a);

  const compData = isClassification
    ? models.map(m => ({
        name: m.name,
        Accuracy: +(((m.accuracy ?? 0) * 100).toFixed(1)),
        "F1 Score": +(((m.f1 ?? 0) * 100).toFixed(1)),
        Precision: +(((m.precision ?? 0) * 100).toFixed(1)),
        Recall: +(((m.recall ?? 0) * 100).toFixed(1)),
      }))
    : models.map(m => ({
        name: m.name,
        "R²": +Math.max(0, (m.r2 ?? 0)).toFixed(3),
        RMSE: +(m.rmse ?? 0).toFixed(3),
        MAE: +(m.mae ?? 0).toFixed(3),
      }));

  const radarData = isClassification
    ? ["Accuracy", "Precision", "Recall", "F1 Score"].map(metric => {
        const entry: Record<string, any> = { metric };
        models.forEach((m, i) => {
          const v = metric === "Accuracy" ? m.accuracy
            : metric === "Precision" ? m.precision
            : metric === "Recall" ? m.recall
            : m.f1;
          entry[`m${i}`] = +((v ?? 0) * 100).toFixed(1);
        });
        return entry;
      })
    : [];

  const scatterData = !isClassification
    ? selected.actuals.slice(0, 100).map((a, i) => ({
        actual: +a.toFixed(3),
        predicted: +(selected.predictions[i] ?? 0).toFixed(3),
      }))
    : [];

  const fi = selected.featureImportance;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BrainCircuit className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold">ML Model Results</h2>
          </div>
          <p className="text-muted-foreground">
            {isClassification ? "Classification" : "Regression"} analysis on cleaned &amp; preprocessed data
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <Target className="w-3 h-3" />
            Target: <strong>{targetColumn}</strong>
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Cpu className="w-3 h-3" />
            Train: {trainSize} / Test: {testSize}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="w-3 h-3" />
            {featureColumns.length} features
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            Best: {best.name}
          </Badge>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 flex gap-3 text-sm text-muted-foreground">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
        <span>
          All models trained on an <strong>80/20 train-test split</strong> after cleaning.
          Features: <strong>{featureColumns.join(", ")}</strong>.
          Task auto-detected as <strong>{task}</strong>.
        </span>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          Select a Model to Inspect
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {models.map((m, i) => (
            <ModelCard
              key={m.name}
              model={m}
              color={MODEL_COLORS[i % MODEL_COLORS.length]}
              isClassification={isClassification}
              selected={selectedIdx === i}
              onSelect={() => setSelectedIdx(i)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full" style={{ background: MODEL_COLORS[selectedIdx % MODEL_COLORS.length] }} />
          <h3 className="text-xl font-semibold">{selected.name} — Detailed Metrics</h3>
          {selected.name === best.name && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Best Model</Badge>
          )}
        </div>

        {isClassification ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Accuracy" value={pct(selected.accuracy)}
              sub={selected.accuracy! >= 0.8 ? "Good" : "Needs improvement"} good={selected.accuracy! >= 0.8} />
            <MetricCard label="Precision" value={pct(selected.precision)}
              sub="True Pos / (TP + FP)" good={selected.precision! >= 0.75} />
            <MetricCard label="Recall" value={pct(selected.recall)}
              sub="True Pos / (TP + FN)" good={selected.recall! >= 0.75} />
            <MetricCard label="F1 Score" value={pct(selected.f1)}
              sub="Harmonic mean of P & R" good={selected.f1! >= 0.75} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="R² Score" value={fmt(selected.r2)}
              sub={selected.r2! >= 0.7 ? "Good fit" : "Poor fit"} good={selected.r2! >= 0.7} />
            <MetricCard label="RMSE" value={fmt(selected.rmse)} sub="Root Mean Squared Error" />
            <MetricCard label="MAE" value={fmt(selected.mae)} sub="Mean Absolute Error" />
            <MetricCard label="MSE" value={fmt(selected.mse)} sub="Mean Squared Error" />
          </div>
        )}

        {isClassification && <ConfusionMatrix model={selected} />}

        {!isClassification && scatterData.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Actual vs Predicted (up to 100 samples)</h4>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="actual" name="Actual" tick={{ fontSize: 11 }} label={{ value: "Actual", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis dataKey="predicted" name="Predicted" tick={{ fontSize: 11 }} label={{ value: "Predicted", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Scatter data={scatterData} fill={MODEL_COLORS[selectedIdx % MODEL_COLORS.length]} fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Model Comparison</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={compData} margin={{ top: 10, right: 20, bottom: 60, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            {isClassification ? (
              <>
                <Bar dataKey="Accuracy" fill={MODEL_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="F1 Score" fill={MODEL_COLORS[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Precision" fill={MODEL_COLORS[2]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recall" fill={MODEL_COLORS[3]} radius={[4, 4, 0, 0]} />
              </>
            ) : (
              <>
                <Bar dataKey="R²" fill={MODEL_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="RMSE" fill={MODEL_COLORS[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="MAE" fill={MODEL_COLORS[2]} radius={[4, 4, 0, 0]} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {isClassification && radarData.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Metric Radar — All Models</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              {models.map((m, i) => (
                <Radar key={m.name} name={m.name} dataKey={`m${i}`}
                  stroke={MODEL_COLORS[i % MODEL_COLORS.length]}
                  fill={MODEL_COLORS[i % MODEL_COLORS.length]} fillOpacity={0.12} />
              ))}
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {fi && fi.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Feature Importance (Correlation-based)</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, fi.length * 36)}>
            <BarChart data={fi} layout="vertical" margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 1]} />
              <YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v: number) => [(v * 100).toFixed(1) + "%", "Importance"]} />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {fi.map((_, i) => (
                  <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 overflow-auto">
        <h3 className="text-lg font-semibold mb-4">Full Metrics Table</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Model</th>
              {isClassification ? (
                <>
                  <th className="py-2 px-3 font-medium text-muted-foreground">Accuracy</th>
                  <th className="py-2 px-3 font-medium text-muted-foreground">Precision</th>
                  <th className="py-2 px-3 font-medium text-muted-foreground">Recall</th>
                  <th className="py-2 px-3 font-medium text-muted-foreground">F1</th>
                </>
              ) : (
                <>
                  <th className="py-2 px-3 font-medium text-muted-foreground">R²</th>
                  <th className="py-2 px-3 font-medium text-muted-foreground">MAE</th>
                  <th className="py-2 px-3 font-medium text-muted-foreground">MSE</th>
                  <th className="py-2 px-3 font-medium text-muted-foreground">RMSE</th>
                </>
              )}
              <th className="py-2 px-3 font-medium text-muted-foreground">Train/Test</th>
              <th className="py-2 px-3 font-medium text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => (
              <tr key={m.name}
                className={`border-b border-border/50 cursor-pointer transition-colors ${selectedIdx === i ? "bg-primary/5" : "hover:bg-muted/30"}`}
                onClick={() => setSelectedIdx(i)}
              >
                <td className="py-3 pr-4 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                    {m.name}
                    {m.name === best.name && (
                      <Badge className="ml-1 text-[10px] py-0 h-4 bg-green-500/10 text-green-600 border-green-500/30">Best</Badge>
                    )}
                  </div>
                </td>
                {isClassification ? (
                  <>
                    <td className="py-3 px-3 tabular-nums text-center">{pct(m.accuracy)}</td>
                    <td className="py-3 px-3 tabular-nums text-center">{pct(m.precision)}</td>
                    <td className="py-3 px-3 tabular-nums text-center">{pct(m.recall)}</td>
                    <td className="py-3 px-3 tabular-nums text-center font-semibold">{pct(m.f1)}</td>
                  </>
                ) : (
                  <>
                    <td className="py-3 px-3 tabular-nums text-center font-semibold">{fmt(m.r2)}</td>
                    <td className="py-3 px-3 tabular-nums text-center">{fmt(m.mae)}</td>
                    <td className="py-3 px-3 tabular-nums text-center">{fmt(m.mse)}</td>
                    <td className="py-3 px-3 tabular-nums text-center">{fmt(m.rmse)}</td>
                  </>
                )}
                <td className="py-3 px-3 text-center text-muted-foreground">{m.trainSize}/{m.testSize}</td>
                <td className="py-3 px-3 text-center text-muted-foreground">{m.durationMs.toFixed(1)} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MLResults;
