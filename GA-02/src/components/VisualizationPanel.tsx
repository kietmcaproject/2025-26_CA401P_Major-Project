import { useMemo, useState, useEffect } from "react";
import { DatasetAnalysis } from "@/lib/data-analyzer";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, LineChart, Line, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, ScatterChart as ScatterChartIcon } from "lucide-react";

interface VisualizationPanelProps {
  analysis: DatasetAnalysis;
  data: Record<string, any>[];
}

const COLORS = [
  "hsl(160, 84%, 39%)",
  "hsl(210, 100%, 55%)",
  "hsl(280, 65%, 60%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(160, 84%, 55%)",
  "hsl(210, 100%, 70%)",
];

export default function VisualizationPanel({ analysis, data }: VisualizationPanelProps) {
  const numericCols = analysis.columns.filter((c) => c.type === "numeric");
  
  const [xAxisCol, setXAxisCol] = useState<string>(analysis.columns[0]?.name || "");
  const [yAxisCol, setYAxisCol] = useState<string>("COUNT");
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "scatter">("bar");

  // Smart defaults when axis changes
  useEffect(() => {
    const xType = analysis.columns.find(c => c.name === xAxisCol)?.type;
    const yType = yAxisCol === "COUNT" ? "numeric" : analysis.columns.find(c => c.name === yAxisCol)?.type;

    if (xType === "numeric" && yAxisCol !== "COUNT" && yType === "numeric") {
      setChartType("scatter");
    } else if (xType === "date" && yType === "numeric") {
      setChartType("line");
    } else if (xType === "categorical" && yType === "numeric") {
      setChartType("bar");
    } else if (xType === "categorical" && (!yAxisCol || yAxisCol === "COUNT")) {
      setChartType("pie");
    }
  }, [xAxisCol, yAxisCol, analysis]);

  const missingData = useMemo(() =>
    analysis.columns
      .filter((c) => c.missingCount > 0)
      .map((c) => ({ name: c.name, missing: c.missingCount, present: c.totalCount - c.missingCount }))
      .sort((a, b) => b.missing - a.missing)
      .slice(0, 15),
  [analysis]);

  const qualityPieData = analysis.qualityBreakdown.map((b) => ({
    name: b.label,
    value: b.score,
  }));

  const chartData = useMemo(() => {
    if (!xAxisCol) return [];
    
    // For scatter plot (numeric vs numeric, no aggregation)
    if (chartType === "scatter") {
      return data.slice(0, 1000).map((r) => ({
        x: Number(r[xAxisCol]),
        y: Number(r[yAxisCol]),
      })).filter((d) => !isNaN(d.x) && !isNaN(d.y));
    }

    // For bar, line, pie (aggregate y by x)
    const aggregated = new Map<string, { sum: number; count: number }>();
    
    data.forEach((row) => {
      let xVal = String(row[xAxisCol]);
      if (xVal === "undefined" || xVal === "null" || xVal === "") xVal = "Unknown";
      
      const yVal = row[yAxisCol];
      const yNum = Number(yVal);
      
      if (!aggregated.has(xVal)) {
        aggregated.set(xVal, { sum: 0, count: 0 });
      }
      
      const curr = aggregated.get(xVal)!;
      curr.count += 1;
      if (!isNaN(yNum)) {
        curr.sum += yNum;
      }
    });

    const result = Array.from(aggregated.entries()).map(([name, stats]) => ({
      name: name.length > 20 ? name.slice(0, 20) + "…" : name,
      value: yAxisCol === "COUNT" ? stats.count : stats.sum, 
    }));

    if (chartType === "pie") {
      return result.sort((a, b) => b.value - a.value).slice(0, 15);
    }
    
    if (chartType === "bar") {
      return result.sort((a, b) => b.value - a.value).slice(0, 50);
    }

    return result.slice(0, 100);

  }, [xAxisCol, yAxisCol, chartType, data]);

  const tooltipStyle = {
    contentStyle: {
      background: "hsl(228, 14%, 13%)",
      border: "1px solid hsl(228, 12%, 17%)",
      borderRadius: "8px",
      color: "hsl(210, 20%, 92%)",
      fontSize: "12px",
    },
  };

  return (
    <div className="space-y-6">
      {/* Interactive Builder */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-xs font-medium text-muted-foreground ml-1">X-Axis</label>
              <Select value={xAxisCol} onValueChange={setXAxisCol}>
                <SelectTrigger className="w-full md:w-[220px] bg-secondary border-border h-9 text-xs">
                  <SelectValue placeholder="Select X-Axis" />
                </SelectTrigger>
                <SelectContent>
                  {analysis.columns.map((c) => (
                    <SelectItem key={c.name} value={c.name} className="text-xs">{c.name} ({c.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-xs font-medium text-muted-foreground ml-1">Y-Axis (Numeric)</label>
              <Select value={yAxisCol} onValueChange={setYAxisCol}>
                <SelectTrigger className="w-full md:w-[220px] bg-secondary border-border h-9 text-xs">
                  <SelectValue placeholder="Select Y-Axis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COUNT" className="text-xs">Row Count (Count)</SelectItem>
                  {numericCols.map((c) => (
                    <SelectItem key={c.name} value={c.name} className="text-xs">{c.name} (Sum)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1 md:self-end">
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)} className="w-full sm:w-auto">
              <TabsList className="h-9 glass-card border border-border">
                <TabsTrigger value="bar" className="px-3" title="Bar Chart"><BarChart3 className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="line" className="px-3" title="Line Chart"><LineChartIcon className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="pie" className="px-3" title="Pie Chart"><PieChartIcon className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="scatter" className="px-3" title="Scatter Plot" disabled={yAxisCol === "COUNT"}><ScatterChartIcon className="w-4 h-4" /></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={380}>
            {chartType === "bar" ? (
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 17%)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215, 14%, 50%)" }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 14%, 50%)" }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} name={yAxisCol === "COUNT" ? "Count" : `Sum of ${yAxisCol}`} />
              </BarChart>
            ) : chartType === "line" ? (
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 17%)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215, 14%, 50%)" }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 14%, 50%)" }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke="hsl(210, 100%, 55%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(210, 100%, 55%)" }} activeDot={{ r: 5 }} name={yAxisCol === "COUNT" ? "Count" : `Sum of ${yAxisCol}`} />
              </LineChart>
            ) : chartType === "pie" ? (
              <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <Pie
                  data={chartData}
                  cx="50%" cy="50%"
                  innerRadius={70} outerRadius={120}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: "hsl(215, 14%, 50%)" }}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
              </PieChart>
            ) : (
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 17%)" />
                <XAxis dataKey="x" name={xAxisCol} tick={{ fontSize: 10, fill: "hsl(215, 14%, 50%)" }} type="number" />
                <YAxis dataKey="y" name={yAxisCol} tick={{ fontSize: 10, fill: "hsl(215, 14%, 50%)" }} type="number" />
                <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={chartData} fill="hsl(280, 65%, 60%)" opacity={0.6} name={`${xAxisCol} vs ${yAxisCol}`} />
              </ScatterChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="h-[380px] w-full flex items-center justify-center border border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Select X and Y axes to generate a chart</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Missing values chart */}
        {missingData.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Missing Values by Column</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={missingData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 17%)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215, 14%, 50%)" }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(215, 14%, 50%)" }} width={80} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="missing" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} name="Missing" />
                <Bar dataKey="present" fill="hsl(160, 84%, 39%)" radius={[0, 4, 4, 0]} name="Present" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quality breakdown pie */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Quality Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={qualityPieData}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={{ stroke: "hsl(215, 14%, 50%)" }}
              >
                {qualityPieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
