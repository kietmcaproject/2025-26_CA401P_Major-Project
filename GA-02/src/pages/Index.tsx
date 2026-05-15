import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, BarChart3, Sparkles, LineChart, Download, ArrowLeft, Columns3, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/FileUpload";
import DataOverview from "@/components/DataOverview";
import ColumnInsights from "@/components/ColumnInsights";
import CleaningPanel from "@/components/CleaningPanel";
import DataPreview from "@/components/DataPreview";
import VisualizationPanel from "@/components/VisualizationPanel";
import MLResults from "@/components/MLResults";
import { analyzeDataset, DatasetAnalysis } from "@/lib/data-analyzer";
import { generateCleaningActions, applyCleaningActions, CleaningAction, dataToCSV, CleaningResult } from "@/lib/data-cleaner";

type Tab = "overview" | "columns" | "clean" | "visualize" | "preview" | "ml";

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "columns", label: "Columns", icon: Columns3 },
  { id: "clean", label: "Clean", icon: Sparkles },
  { id: "visualize", label: "Visualize", icon: LineChart },
  { id: "preview", label: "Preview", icon: Upload },
  { id: "ml", label: "ML Results", icon: BrainCircuit },
];

const Index = () => {
  const [rawData, setRawData] = useState<Record<string, any>[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [cleaningActions, setCleaningActions] = useState<CleaningAction[]>([]);
  const [isCleanApplied, setIsCleanApplied] = useState(false);
  const [cleanedData, setCleanedData] = useState<Record<string, any>[] | null>(null);
  const [cleanResult, setCleanResult] = useState<CleaningResult | undefined>();

  const analysis: DatasetAnalysis | null = useMemo(() => {
    if (!rawData || headers.length === 0) return null;
    return analyzeDataset(rawData, headers);
  }, [rawData, headers]);

  const cleanedAnalysis: DatasetAnalysis | null = useMemo(() => {
    if (!cleanedData) return null;
    const h = Object.keys(cleanedData[0] || {});
    return analyzeDataset(cleanedData, h);
  }, [cleanedData]);

  const handleDataLoaded = useCallback((data: Record<string, any>[], hdrs: string[], name: string) => {
    setRawData(data);
    setHeaders(hdrs);
    setFileName(name);
    setCleanedData(null);
    setIsCleanApplied(false);
    setCleanResult(undefined);
    const a = analyzeDataset(data, hdrs);
    setCleaningActions(generateCleaningActions(a));
    setActiveTab("overview");
  }, []);

  const handleToggleAction = useCallback((id: string) => {
    setCleaningActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  }, []);

  const handleApplyClean = useCallback(() => {
    if (!rawData || !analysis) return;
    const result = applyCleaningActions(rawData, cleaningActions, analysis);
    setCleanedData(result.data);
    setCleanResult(result);
    setIsCleanApplied(true);
  }, [rawData, analysis, cleaningActions]);

  const handleExport = useCallback(() => {
    const exportData = cleanedData || rawData;
    if (!exportData) return;
    const csv = dataToCSV(exportData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleaned_${fileName}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [cleanedData, rawData, fileName]);

  const handleReset = useCallback(() => {
    setRawData(null);
    setHeaders([]);
    setFileName("");
    setCleanedData(null);
    setIsCleanApplied(false);
    setCleanResult(undefined);
    setCleaningActions([]);
  }, []);

  const currentData = cleanedData || rawData;
  const currentHeaders = cleanedData ? Object.keys(cleanedData[0] || {}) : headers;

  if (!rawData || !analysis) {
    return <FileUpload onDataLoaded={handleDataLoaded} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-foreground">{fileName}</h1>
              <p className="text-[10px] text-muted-foreground">
                {analysis.rowCount.toLocaleString()} rows · {analysis.columnCount} cols
                {cleanedData && " · Cleaned"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cleanedData && (
              <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">
                Score: {cleanedAnalysis?.qualityScore ?? analysis.qualityScore} → {cleanedAnalysis?.qualityScore ?? "—"}
              </span>
            )}
            <Button onClick={handleExport} size="sm" className="gap-2">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-14 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && (
              <DataOverview analysis={cleanedAnalysis || analysis} fileName={fileName} />
            )}
            {activeTab === "columns" && (
              <ColumnInsights columns={(cleanedAnalysis || analysis).columns} />
            )}
            {activeTab === "clean" && (
              <CleaningPanel
                actions={cleaningActions}
                onToggleAction={handleToggleAction}
                onApply={handleApplyClean}
                isApplied={isCleanApplied}
                result={cleanResult}
              />
            )}
            {activeTab === "visualize" && currentData && (
              <VisualizationPanel analysis={cleanedAnalysis || analysis} data={currentData} />
            )}
            {activeTab === "preview" && currentData && (
              <DataPreview data={currentData} headers={currentHeaders} />
            )}
            {activeTab === "ml" && currentData && (
              <MLResults data={currentData} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
