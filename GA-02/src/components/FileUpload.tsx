import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseCSV } from "@/lib/data-analyzer";

interface FileUploadProps {
  onDataLoaded: (data: Record<string, any>[], headers: string[], fileName: string) => void;
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be under 50MB");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const { data, headers } = await parseCSV(file);
      if (data.length === 0) throw new Error("No data found in file");
      onDataLoaded(data, headers, file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse file");
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">AI-Powered</span> Data Platform
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Upload your dataset to instantly analyze, clean, and visualize your data with intelligent automation.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-2xl"
      >
        <label
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center w-full p-12 rounded-2xl cursor-pointer
            border-2 border-dashed transition-all duration-300
            ${isDragging
              ? "border-primary bg-primary/5 glow-primary"
              : "border-border hover:border-primary/50 hover:bg-card/50"
            }
            ${isLoading ? "pointer-events-none opacity-60" : ""}
          `}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleInputChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isLoading}
          />

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Parsing your dataset...</p>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  {isDragging ? (
                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                  ) : (
                    <Upload className="w-8 h-8 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-foreground font-medium text-lg">
                    {isDragging ? "Drop your file here" : "Drag & drop your CSV file"}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">or click to browse · up to 50MB</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </label>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-8 mt-16 text-muted-foreground text-sm"
      >
        {["Auto-detect issues", "One-click cleaning", "Visual analytics", "Export cleaned data"].map((f) => (
          <div key={f} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            {f}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
