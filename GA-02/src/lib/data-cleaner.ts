import { ColumnStats, DatasetAnalysis } from "./data-analyzer";

export interface CleaningAction {
  id: string;
  label: string;
  description: string;
  category: "missing" | "duplicates" | "outliers" | "formatting" | "types";
  impact: "high" | "medium" | "low";
  affectedRows: number;
  enabled: boolean;
}

export interface CleaningResult {
  data: Record<string, any>[];
  actionsApplied: string[];
  rowsRemoved: number;
  cellsModified: number;
}

export function generateCleaningActions(analysis: DatasetAnalysis): CleaningAction[] {
  const actions: CleaningAction[] = [];

  // Duplicate removal
  if (analysis.duplicateRowCount > 0) {
    actions.push({
      id: "remove_duplicates",
      label: "Remove duplicate rows",
      description: `Remove ${analysis.duplicateRowCount} exact duplicate rows`,
      category: "duplicates",
      impact: "high",
      affectedRows: analysis.duplicateRowCount,
      enabled: true,
    });
  }

  // Per-column actions
  for (const col of analysis.columns) {
    // Missing values
    if (col.missingCount > 0) {
      if (col.type === "numeric") {
        actions.push({
          id: `impute_median_${col.name}`,
          label: `Impute "${col.name}" with median`,
          description: `Fill ${col.missingCount} missing values with median (${col.median?.toFixed(2)})`,
          category: "missing",
          impact: col.missingPercent > 20 ? "high" : "medium",
          affectedRows: col.missingCount,
          enabled: col.missingPercent < 50,
        });
      } else if (col.type === "categorical") {
        const mode = col.topValues?.[0]?.value || "Unknown";
        actions.push({
          id: `impute_mode_${col.name}`,
          label: `Impute "${col.name}" with mode`,
          description: `Fill ${col.missingCount} missing values with "${mode}"`,
          category: "missing",
          impact: col.missingPercent > 20 ? "high" : "medium",
          affectedRows: col.missingCount,
          enabled: col.missingPercent < 50,
        });
      }

      if (col.missingPercent > 50) {
        actions.push({
          id: `drop_column_${col.name}`,
          label: `Drop column "${col.name}"`,
          description: `Column is ${col.missingPercent.toFixed(0)}% empty — consider removing`,
          category: "missing",
          impact: "high",
          affectedRows: analysis.rowCount,
          enabled: false,
        });
      }
    }

    // Outliers
    if (col.outlierCount && col.outlierCount > 0) {
      actions.push({
        id: `cap_outliers_${col.name}`,
        label: `Cap outliers in "${col.name}"`,
        description: `Cap ${col.outlierCount} outliers to Q1-1.5*IQR / Q3+1.5*IQR`,
        category: "outliers",
        impact: "medium",
        affectedRows: col.outlierCount,
        enabled: false,
      });
    }

    // Whitespace
    const wsIssue = col.issues.find((i) => i.type === "whitespace");
    if (wsIssue) {
      actions.push({
        id: `trim_${col.name}`,
        label: `Trim whitespace in "${col.name}"`,
        description: `Clean ${wsIssue.count} values with extra whitespace`,
        category: "formatting",
        impact: "low",
        affectedRows: wsIssue.count,
        enabled: true,
      });
    }
  }

  return actions;
}

export function applyCleaningActions(
  data: Record<string, any>[],
  actions: CleaningAction[],
  analysis: DatasetAnalysis
): CleaningResult {
  let cleaned = data.map((row) => ({ ...row }));
  const applied: string[] = [];
  let rowsRemoved = 0;
  let cellsModified = 0;

  const enabled = actions.filter((a) => a.enabled);

  for (const action of enabled) {
    if (action.id === "remove_duplicates") {
      const before = cleaned.length;
      const seen = new Set<string>();
      cleaned = cleaned.filter((row) => {
        const key = JSON.stringify(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      rowsRemoved += before - cleaned.length;
      applied.push(action.label);
      continue;
    }

    const colMatch = action.id.match(/^(impute_median|impute_mode|cap_outliers|trim|drop_column)_(.+)$/);
    if (!colMatch) continue;
    const [, op, colName] = colMatch;
    const colStats = analysis.columns.find((c) => c.name === colName);
    if (!colStats) continue;

    if (op === "drop_column") {
      cleaned.forEach((row) => delete row[colName]);
      applied.push(action.label);
      continue;
    }

    if (op === "impute_median" && colStats.median !== undefined) {
      cleaned.forEach((row) => {
        if (row[colName] === null || row[colName] === undefined || row[colName] === "") {
          row[colName] = colStats.median;
          cellsModified++;
        }
      });
      applied.push(action.label);
    }

    if (op === "impute_mode" && colStats.topValues?.[0]) {
      const mode = colStats.topValues[0].value;
      cleaned.forEach((row) => {
        if (row[colName] === null || row[colName] === undefined || row[colName] === "") {
          row[colName] = mode;
          cellsModified++;
        }
      });
      applied.push(action.label);
    }

    if (op === "cap_outliers" && colStats.q1 !== undefined && colStats.q3 !== undefined) {
      const iqr = colStats.q3 - colStats.q1;
      const lower = colStats.q1 - 1.5 * iqr;
      const upper = colStats.q3 + 1.5 * iqr;
      cleaned.forEach((row) => {
        const v = Number(row[colName]);
        if (!isNaN(v)) {
          if (v < lower) { row[colName] = lower; cellsModified++; }
          else if (v > upper) { row[colName] = upper; cellsModified++; }
        }
      });
      applied.push(action.label);
    }

    if (op === "trim") {
      cleaned.forEach((row) => {
        if (typeof row[colName] === "string" && row[colName] !== row[colName].trim()) {
          row[colName] = row[colName].trim();
          cellsModified++;
        }
      });
      applied.push(action.label);
    }
  }

  return { data: cleaned, actionsApplied: applied, rowsRemoved, cellsModified };
}

export function dataToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const v = row[h];
      if (v === null || v === undefined) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}
