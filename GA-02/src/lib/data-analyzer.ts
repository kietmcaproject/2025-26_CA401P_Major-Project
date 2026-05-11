import Papa from "papaparse";

export interface ColumnStats {
  name: string;
  type: "numeric" | "categorical" | "datetime" | "boolean" | "mixed" | "empty";
  totalCount: number;
  missingCount: number;
  missingPercent: number;
  uniqueCount: number;
  duplicateCount: number;
  // Numeric stats
  mean?: number;
  median?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  q1?: number;
  q3?: number;
  outlierCount?: number;
  outlierIndices?: number[];
  // Categorical stats
  topValues?: { value: string; count: number }[];
  // Issues
  issues: ColumnIssue[];
  qualityScore: number;
}

export interface ColumnIssue {
  type: "missing" | "outlier" | "duplicate" | "type_mismatch" | "whitespace" | "empty_string";
  severity: "error" | "warning" | "info";
  count: number;
  description: string;
  suggestion: string;
}

export interface DatasetAnalysis {
  rowCount: number;
  columnCount: number;
  duplicateRowCount: number;
  duplicateRowIndices: number[];
  totalMissingCells: number;
  totalCells: number;
  missingPercent: number;
  columns: ColumnStats[];
  qualityScore: number;
  qualityBreakdown: { label: string; score: number; weight: number }[];
  summary: string;
}

export function parseCSV(file: File): Promise<{ data: Record<string, any>[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        resolve({ data: results.data as Record<string, any>[], headers });
      },
      error: (err) => reject(err),
    });
  });
}

function inferType(values: any[]): ColumnStats["type"] {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (nonNull.length === 0) return "empty";

  let numCount = 0, boolCount = 0, dateCount = 0;
  for (const v of nonNull) {
    if (typeof v === "number" || (!isNaN(Number(v)) && v !== "")) numCount++;
    if (typeof v === "boolean" || v === "true" || v === "false") boolCount++;
    if (v instanceof Date || (!isNaN(Date.parse(String(v))) && String(v).length > 4)) dateCount++;
  }

  const ratio = nonNull.length;
  if (boolCount / ratio > 0.8) return "boolean";
  if (numCount / ratio > 0.8) return "numeric";
  if (dateCount / ratio > 0.8) return "datetime";
  if (numCount / ratio > 0.3 && numCount / ratio <= 0.8) return "mixed";
  return "categorical";
}

function getNumericValues(values: any[]): number[] {
  return values
    .filter((v) => v !== null && v !== undefined && v !== "")
    .map(Number)
    .filter((n) => !isNaN(n));
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

function analyzeColumn(name: string, values: any[]): ColumnStats {
  const total = values.length;
  const missing = values.filter((v) => v === null || v === undefined || v === "").length;
  const nonMissing = values.filter((v) => v !== null && v !== undefined && v !== "");
  const unique = new Set(nonMissing.map(String)).size;
  const type = inferType(values);
  const issues: ColumnIssue[] = [];

  let mean: number | undefined, median: number | undefined, stdDev: number | undefined;
  let min: number | undefined, max: number | undefined, q1: number | undefined, q3: number | undefined;
  let outlierCount = 0;
  let outlierIndices: number[] = [];
  let topValues: { value: string; count: number }[] | undefined;

  // Missing values
  if (missing > 0) {
    const severity = missing / total > 0.3 ? "error" : missing / total > 0.1 ? "warning" : "info";
    issues.push({
      type: "missing",
      severity,
      count: missing,
      description: `${missing} missing values (${((missing / total) * 100).toFixed(1)}%)`,
      suggestion: type === "numeric" ? "Impute with median or mean" : "Impute with mode or drop rows",
    });
  }

  // Whitespace check for strings
  const whitespaceCount = nonMissing.filter((v) => typeof v === "string" && v !== v.trim()).length;
  if (whitespaceCount > 0) {
    issues.push({
      type: "whitespace",
      severity: "warning",
      count: whitespaceCount,
      description: `${whitespaceCount} values have leading/trailing whitespace`,
      suggestion: "Trim whitespace from values",
    });
  }

  if (type === "numeric") {
    const nums = getNumericValues(values);
    if (nums.length > 0) {
      const sorted = [...nums].sort((a, b) => a - b);
      mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      median = percentile(sorted, 50);
      min = sorted[0];
      max = sorted[sorted.length - 1];
      q1 = percentile(sorted, 25);
      q3 = percentile(sorted, 75);
      const variance = nums.reduce((acc, v) => acc + (v - mean!) ** 2, 0) / nums.length;
      stdDev = Math.sqrt(variance);

      // IQR outlier detection
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      outlierIndices = [];
      values.forEach((v, i) => {
        const n = Number(v);
        if (!isNaN(n) && (n < lowerBound || n > upperBound)) {
          outlierIndices.push(i);
        }
      });
      outlierCount = outlierIndices.length;

      if (outlierCount > 0) {
        issues.push({
          type: "outlier",
          severity: outlierCount / total > 0.1 ? "warning" : "info",
          count: outlierCount,
          description: `${outlierCount} outliers detected (IQR method)`,
          suggestion: "Cap/floor values or investigate individually",
        });
      }

      // Type mismatch
      const nonNumeric = nonMissing.filter((v) => isNaN(Number(v))).length;
      if (nonNumeric > 0) {
        issues.push({
          type: "type_mismatch",
          severity: "warning",
          count: nonNumeric,
          description: `${nonNumeric} non-numeric values in numeric column`,
          suggestion: "Convert to numeric or treat as missing",
        });
      }
    }
  }

  if (type === "categorical" || type === "mixed") {
    const freq: Record<string, number> = {};
    nonMissing.forEach((v) => {
      const key = String(v).trim();
      freq[key] = (freq[key] || 0) + 1;
    });
    topValues = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }));
  }

  // Quality score for column (0-100)
  let qualityScore = 100;
  qualityScore -= (missing / total) * 40; // Missing penalty
  qualityScore -= (outlierCount / total) * 20; // Outlier penalty
  qualityScore -= (whitespaceCount / total) * 10; // Whitespace penalty
  if (type === "mixed") qualityScore -= 15;
  qualityScore = Math.max(0, Math.round(qualityScore));

  return {
    name, type, totalCount: total,
    missingCount: missing,
    missingPercent: (missing / total) * 100,
    uniqueCount: unique,
    duplicateCount: nonMissing.length - unique,
    mean, median, stdDev, min, max, q1, q3,
    outlierCount, outlierIndices,
    topValues, issues, qualityScore,
  };
}

function findDuplicateRows(data: Record<string, any>[]): number[] {
  const seen = new Set<string>();
  const dupes: number[] = [];
  data.forEach((row, i) => {
    const key = JSON.stringify(row);
    if (seen.has(key)) dupes.push(i);
    else seen.add(key);
  });
  return dupes;
}

function generateSummary(analysis: Omit<DatasetAnalysis, "summary">): string {
  const { rowCount, columnCount, qualityScore, columns, duplicateRowCount, missingPercent } = analysis;
  const worstCols = columns.filter((c) => c.qualityScore < 70).sort((a, b) => a.qualityScore - b.qualityScore);
  const totalIssues = columns.reduce((acc, c) => acc + c.issues.length, 0);

  let summary = `Dataset contains **${rowCount.toLocaleString()} rows** and **${columnCount} columns**. `;
  summary += `Overall quality score is **${qualityScore}/100**. `;

  if (duplicateRowCount > 0) {
    summary += `Found **${duplicateRowCount} duplicate rows** that can be removed. `;
  }
  if (missingPercent > 0) {
    summary += `**${missingPercent.toFixed(1)}%** of cells are missing. `;
  }
  if (totalIssues > 0) {
    summary += `Detected **${totalIssues} issues** across all columns. `;
  }
  if (worstCols.length > 0) {
    summary += `Columns needing attention: ${worstCols.slice(0, 3).map((c) => `**${c.name}** (${c.qualityScore}/100)`).join(", ")}. `;
  }

  return summary;
}

export function analyzeDataset(data: Record<string, any>[], headers: string[]): DatasetAnalysis {
  const rowCount = data.length;
  const columnCount = headers.length;
  const duplicateRowIndices = findDuplicateRows(data);
  const columns = headers.map((h) => analyzeColumn(h, data.map((row) => row[h])));

  const totalCells = rowCount * columnCount;
  const totalMissingCells = columns.reduce((acc, c) => acc + c.missingCount, 0);

  // Overall quality score
  const completeness = totalCells > 0 ? ((totalCells - totalMissingCells) / totalCells) * 100 : 100;
  const consistency = columns.filter((c) => c.type !== "mixed").length / Math.max(columnCount, 1) * 100;
  const uniqueness = rowCount > 0 ? ((rowCount - duplicateRowIndices.length) / rowCount) * 100 : 100;
  const validity = columns.reduce((acc, c) => acc + c.qualityScore, 0) / Math.max(columnCount, 1);

  const qualityBreakdown = [
    { label: "Completeness", score: Math.round(completeness), weight: 0.35 },
    { label: "Consistency", score: Math.round(consistency), weight: 0.25 },
    { label: "Uniqueness", score: Math.round(uniqueness), weight: 0.2 },
    { label: "Validity", score: Math.round(validity), weight: 0.2 },
  ];

  const qualityScore = Math.round(
    qualityBreakdown.reduce((acc, b) => acc + b.score * b.weight, 0)
  );

  const partial = {
    rowCount, columnCount, duplicateRowCount: duplicateRowIndices.length,
    duplicateRowIndices, totalMissingCells, totalCells,
    missingPercent: totalCells > 0 ? (totalMissingCells / totalCells) * 100 : 0,
    columns, qualityScore, qualityBreakdown,
  };

  return { ...partial, summary: generateSummary(partial) };
}
