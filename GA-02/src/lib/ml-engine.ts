/**
 * ml-engine.ts
 * Pure TypeScript implementations of ML models:
 *  - Linear Regression (least squares)
 *  - Logistic Regression (gradient descent)
 *  - K-Nearest Neighbours (k=5)
 *  - Naive Bayes (Gaussian)
 *  - Decision Tree (CART – simplified)
 *
 * All metrics computed on a real 80/20 train-test split.
 */

// ─── helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[], seed = 42): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mean(arr: number[]) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function variance(arr: number[]) { const m = mean(arr); return mean(arr.map(x => (x - m) ** 2)); }
function std(arr: number[]) { return Math.sqrt(variance(arr)); }

/** Min-max normalise a column to [0,1] using train stats */
function normalise(
  train: number[],
  test: number[]
): { trainN: number[]; testN: number[]; min: number; max: number } {
  const mn = Math.min(...train);
  const mx = Math.max(...train);
  const rng = mx - mn || 1;
  return {
    trainN: train.map(v => (v - mn) / rng),
    testN: test.map(v => (v - mn) / rng),
    min: mn,
    max: mx,
  };
}

// ─── types ────────────────────────────────────────────────────────────────────

export type TaskType = "regression" | "classification";

export interface ModelResult {
  name: string;
  task: TaskType;
  // classification
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  confusionMatrix?: number[][];
  classes?: string[];
  // regression
  mae?: number;
  mse?: number;
  rmse?: number;
  r2?: number;
  // shared
  trainSize: number;
  testSize: number;
  durationMs: number;
  predictions: number[];
  actuals: number[];
  featureImportance?: { feature: string; importance: number }[];
}

export interface MLRunResult {
  task: TaskType;
  targetColumn: string;
  featureColumns: string[];
  models: ModelResult[];
  trainSize: number;
  testSize: number;
}

// ─── metric helpers ────────────────────────────────────────────────────────────

function regressionMetrics(
  actuals: number[],
  preds: number[]
): { mae: number; mse: number; rmse: number; r2: number } {
  const n = actuals.length;
  const m = mean(actuals);
  let mae = 0, mse = 0, ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    const e = actuals[i] - preds[i];
    mae += Math.abs(e);
    mse += e * e;
    ssTot += (actuals[i] - m) ** 2;
    ssRes += e * e;
  }
  return {
    mae: mae / n,
    mse: mse / n,
    rmse: Math.sqrt(mse / n),
    r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot,
  };
}

function classificationMetrics(
  actuals: number[],
  preds: number[],
  classes: number[]
): { accuracy: number; precision: number; recall: number; f1: number; confusionMatrix: number[][] } {
  const nC = classes.length;
  const idx = Object.fromEntries(classes.map((c, i) => [c, i]));
  const cm: number[][] = Array.from({ length: nC }, () => Array(nC).fill(0));
  for (let i = 0; i < actuals.length; i++) {
    const r = idx[actuals[i]] ?? 0;
    const c = idx[preds[i]] ?? 0;
    cm[r][c]++;
  }
  const correct = cm.reduce((s, row, i) => s + row[i], 0);
  const accuracy = correct / actuals.length;

  // macro average precision / recall / f1
  let precSum = 0, recSum = 0;
  for (let i = 0; i < nC; i++) {
    const tp = cm[i][i];
    const predPos = cm.reduce((s, row) => s + row[i], 0);
    const actPos = cm[i].reduce((s, v) => s + v, 0);
    precSum += predPos === 0 ? 0 : tp / predPos;
    recSum += actPos === 0 ? 0 : tp / actPos;
  }
  const precision = precSum / nC;
  const recall = recSum / nC;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  return { accuracy, precision, recall, f1, confusionMatrix: cm };
}

// ─── data preparation ─────────────────────────────────────────────────────────

function prepareData(
  data: Record<string, any>[],
  featureCols: string[],
  targetCol: string
): { X: number[][]; y: number[] } {
  const rows: { X: number[]; y: number }[] = [];
  for (const row of data) {
    const yRaw = row[targetCol];
    const yVal = Number(yRaw);
    if (isNaN(yVal)) continue;
    const xRow: number[] = [];
    let ok = true;
    for (const f of featureCols) {
      const v = Number(row[f]);
      if (isNaN(v)) { ok = false; break; }
      xRow.push(v);
    }
    if (ok) rows.push({ X: xRow, y: yVal });
  }
  return { X: rows.map(r => r.X), y: rows.map(r => r.y) };
}

// ─── Linear Regression ────────────────────────────────────────────────────────

function linearRegression(
  Xtr: number[][], ytr: number[],
  Xte: number[][]
): number[] {
  // Add bias column
  const n = Xtr.length;
  const p = Xtr[0].length + 1;
  const X = Xtr.map(row => [1, ...row]);
  const Xe = Xte.map(row => [1, ...row]);

  // Normal equation: w = (X'X + λI)^-1 X'y  (ridge λ=0.001)
  const lambda = 0.001;
  // Build X'X
  const XtX: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
  const Xty: number[] = Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      Xty[j] += X[i][j] * ytr[i];
      for (let k = 0; k < p; k++) XtX[j][k] += X[i][j] * X[i][k];
    }
  }
  // Add ridge
  for (let j = 1; j < p; j++) XtX[j][j] += lambda;

  const w = gaussianElim(XtX, Xty);
  return Xe.map(row => row.reduce((s, v, j) => s + v * w[j], 0));
}

function gaussianElim(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const div = M[col][col] || 1e-10;
    for (let row = col + 1; row < n; row++) {
      const f = M[row][col] / div;
      for (let c = col; c <= n; c++) M[row][c] -= f * M[col][c];
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
    x[i] /= M[i][i] || 1e-10;
  }
  return x;
}

// ─── Logistic Regression ──────────────────────────────────────────────────────

function sigmoid(z: number) { return 1 / (1 + Math.exp(-Math.max(-250, Math.min(250, z)))); }

function logisticRegression(
  Xtr: number[][], ytr: number[],
  Xte: number[][],
  classes: number[]
): number[] {
  // One-vs-rest for multi-class
  const classProbs = classes.map(cls => {
    const yBin = ytr.map(v => (v === cls ? 1 : 0));
    const w = fitLogistic(Xtr, yBin, 0.01, 200);
    return Xte.map(row => sigmoid(row.reduce((s, v, j) => s + v * w[j + 1], w[0])));
  });
  return Xte.map((_, i) => {
    let bestCls = classes[0], bestProb = -Infinity;
    classes.forEach((cls, ci) => {
      if (classProbs[ci][i] > bestProb) { bestProb = classProbs[ci][i]; bestCls = cls; }
    });
    return bestCls;
  });
}

function fitLogistic(X: number[][], y: number[], lr: number, epochs: number): number[] {
  const n = X.length, p = X[0].length;
  const w = Array(p + 1).fill(0);
  for (let e = 0; e < epochs; e++) {
    const grad = Array(p + 1).fill(0);
    for (let i = 0; i < n; i++) {
      const z = w[0] + X[i].reduce((s, v, j) => s + v * w[j + 1], 0);
      const err = sigmoid(z) - y[i];
      grad[0] += err;
      for (let j = 0; j < p; j++) grad[j + 1] += err * X[i][j];
    }
    for (let j = 0; j <= p; j++) w[j] -= (lr / n) * grad[j];
  }
  return w;
}

// ─── KNN ──────────────────────────────────────────────────────────────────────

function knn(
  Xtr: number[][], ytr: number[],
  Xte: number[][],
  k: number,
  task: TaskType
): number[] {
  return Xte.map(xq => {
    const dists = Xtr.map((xt, i) => ({
      d: Math.sqrt(xt.reduce((s, v, j) => s + (v - xq[j]) ** 2, 0)),
      y: ytr[i],
    })).sort((a, b) => a.d - b.d).slice(0, k);
    if (task === "regression") return mean(dists.map(d => d.y));
    const freq: Record<number, number> = {};
    dists.forEach(d => { freq[d.y] = (freq[d.y] || 0) + 1; });
    return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
  });
}

// ─── Naive Bayes (Gaussian) ───────────────────────────────────────────────────

function naiveBayes(
  Xtr: number[][], ytr: number[],
  Xte: number[][],
  classes: number[]
): number[] {
  const p = Xtr[0].length;
  // Per-class stats
  const stats = classes.map(cls => {
    const rows = Xtr.filter((_, i) => ytr[i] === cls);
    const prior = rows.length / Xtr.length;
    const feats = Array.from({ length: p }, (_, j) => {
      const vals = rows.map(r => r[j]);
      const m = mean(vals);
      const s = std(vals) || 1e-6;
      return { mean: m, std: s };
    });
    return { cls, prior, feats };
  });

  return Xte.map(row => {
    let bestCls = classes[0], bestLog = -Infinity;
    stats.forEach(({ cls, prior, feats }) => {
      let logP = Math.log(prior);
      feats.forEach((f, j) => {
        const v = row[j];
        const expo = -((v - f.mean) ** 2) / (2 * f.std * f.std);
        logP += expo - Math.log(f.std * Math.sqrt(2 * Math.PI));
      });
      if (logP > bestLog) { bestLog = logP; bestCls = cls; }
    });
    return bestCls;
  });
}

// ─── Decision Tree (simplified CART) ─────────────────────────────────────────

interface TreeNode {
  isLeaf: boolean;
  value?: number;
  featureIdx?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

function gini(y: number[]): number {
  const freq: Record<number, number> = {};
  y.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return 1 - Object.values(freq).reduce((s, c) => s + (c / y.length) ** 2, 0);
}

function mseImpurity(y: number[]): number {
  if (y.length === 0) return 0;
  const m = mean(y);
  return mean(y.map(v => (v - m) ** 2));
}

function buildTree(
  X: number[][], y: number[],
  depth: number, maxDepth: number,
  task: TaskType
): TreeNode {
  if (depth >= maxDepth || y.length <= 5 || new Set(y).size === 1) {
    return {
      isLeaf: true,
      value: task === "regression" ? mean(y) : Number(Object.entries(
        y.reduce((f: Record<number, number>, v) => { f[v] = (f[v] || 0) + 1; return f; }, {})
      ).sort((a, b) => b[1] - a[1])[0][0]),
    };
  }
  const p = X[0].length;
  let bestGain = -Infinity, bestFeat = 0, bestThr = 0;
  const parentImp = task === "classification" ? gini(y) : mseImpurity(y);

  for (let f = 0; f < p; f++) {
    const vals = [...new Set(X.map(r => r[f]))].sort((a, b) => a - b);
    const thresholds = vals.slice(0, -1).map((v, i) => (v + vals[i + 1]) / 2);
    for (const thr of thresholds.slice(0, 20)) { // limit for speed
      const L = y.filter((_, i) => X[i][f] <= thr);
      const R = y.filter((_, i) => X[i][f] > thr);
      if (L.length === 0 || R.length === 0) continue;
      const impL = task === "classification" ? gini(L) : mseImpurity(L);
      const impR = task === "classification" ? gini(R) : mseImpurity(R);
      const gain = parentImp - (L.length / y.length) * impL - (R.length / y.length) * impR;
      if (gain > bestGain) { bestGain = gain; bestFeat = f; bestThr = thr; }
    }
  }

  if (bestGain <= 0) {
    return {
      isLeaf: true,
      value: task === "regression" ? mean(y) : Number(Object.entries(
        y.reduce((f: Record<number, number>, v) => { f[v] = (f[v] || 0) + 1; return f; }, {})
      ).sort((a, b) => b[1] - a[1])[0][0]),
    };
  }

  const leftIdx = X.map((r, i) => r[bestFeat] <= bestThr ? i : -1).filter(i => i >= 0);
  const rightIdx = X.map((r, i) => r[bestFeat] > bestThr ? i : -1).filter(i => i >= 0);
  return {
    isLeaf: false,
    featureIdx: bestFeat,
    threshold: bestThr,
    left: buildTree(leftIdx.map(i => X[i]), leftIdx.map(i => y[i]), depth + 1, maxDepth, task),
    right: buildTree(rightIdx.map(i => X[i]), rightIdx.map(i => y[i]), depth + 1, maxDepth, task),
  };
}

function predictTree(node: TreeNode, row: number[]): number {
  if (node.isLeaf) return node.value!;
  return row[node.featureIdx!] <= node.threshold!
    ? predictTree(node.left!, row)
    : predictTree(node.right!, row);
}

// ─── feature importance (permutation proxy) ───────────────────────────────────

function featureImportance(
  Xtr: number[][], ytr: number[],
  featureCols: string[],
  task: TaskType
): { feature: string; importance: number }[] {
  // Use variance of each feature weighted by its correlation with y
  const yCentered = ytr.map(v => v - mean(ytr));
  const yStd = std(ytr) || 1;
  const imps = featureCols.map((feat, j) => {
    const col = Xtr.map(r => r[j]);
    const xStd = std(col) || 1;
    const corr = Math.abs(
      col.reduce((s, v, i) => s + ((v - mean(col)) / xStd) * (yCentered[i] / yStd), 0) / col.length
    );
    return { feature: feat, importance: corr };
  });
  const total = imps.reduce((s, i) => s + i.importance, 0) || 1;
  return imps.map(i => ({ feature: i.feature, importance: i.importance / total }))
    .sort((a, b) => b.importance - a.importance);
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export function runMLModels(data: Record<string, any>[]): MLRunResult | null {
  if (!data || data.length < 20) return null;

  const headers = Object.keys(data[0]);

  // Detect numeric columns
  const numericCols = headers.filter(h => {
    const vals = data.map(r => r[h]).filter(v => v !== null && v !== undefined && v !== "");
    const numVals = vals.map(Number).filter(v => !isNaN(v));
    return numVals.length / vals.length > 0.8;
  });

  if (numericCols.length < 2) return null;

  // Target = last numeric col; features = rest
  const targetCol = numericCols[numericCols.length - 1];
  const featureCols = numericCols.slice(0, -1).slice(0, 10); // max 10 features
  if (featureCols.length === 0) return null;

  const { X, y } = prepareData(data, featureCols, targetCol);
  if (X.length < 20) return null;

  // 80/20 split
  const indices = shuffle(Array.from({ length: X.length }, (_, i) => i));
  const splitAt = Math.floor(X.length * 0.8);
  const trIdx = indices.slice(0, splitAt);
  const teIdx = indices.slice(splitAt);

  const Xtr = trIdx.map(i => X[i]), ytr = trIdx.map(i => y[i]);
  const Xte = teIdx.map(i => X[i]), yte = teIdx.map(i => y[i]);

  // Normalise features
  const Xtrn: number[][] = Array.from({ length: Xtr.length }, () => []);
  const Xten: number[][] = Array.from({ length: Xte.length }, () => []);
  for (let j = 0; j < featureCols.length; j++) {
    const col = Xtr.map(r => r[j]);
    const cte = Xte.map(r => r[j]);
    const { trainN, testN } = normalise(col, cte);
    trainN.forEach((v, i) => Xtrn[i].push(v));
    testN.forEach((v, i) => Xten[i].push(v));
  }

  // Decide task: if unique values <= 15 and all integers → classification
  const uniqueY = [...new Set(y)];
  const allInt = uniqueY.every(v => Number.isInteger(v));
  const task: TaskType = uniqueY.length <= 15 && allInt ? "classification" : "regression";
  const classes = uniqueY.sort((a, b) => a - b);

  const fi = featureImportance(Xtrn, ytr, featureCols, task);

  const models: ModelResult[] = [];

  // ── Linear / Logistic Regression ────────────────────────────────────────────
  {
    const t0 = performance.now();
    let preds: number[];
    if (task === "regression") {
      preds = linearRegression(Xtrn, ytr, Xten);
    } else {
      preds = logisticRegression(Xtrn, ytr, Xten, classes);
    }
    const ms = performance.now() - t0;
    const result: ModelResult = {
      name: task === "regression" ? "Linear Regression" : "Logistic Regression",
      task, trainSize: Xtr.length, testSize: Xte.length,
      durationMs: ms, predictions: preds, actuals: yte, featureImportance: fi,
    };
    if (task === "regression") {
      Object.assign(result, regressionMetrics(yte, preds));
    } else {
      Object.assign(result, classificationMetrics(yte, preds, classes));
      result.classes = classes.map(String);
    }
    models.push(result);
  }

  // ── KNN ─────────────────────────────────────────────────────────────────────
  {
    const t0 = performance.now();
    const preds = knn(Xtrn, ytr, Xten, 5, task);
    const ms = performance.now() - t0;
    const result: ModelResult = {
      name: "K-Nearest Neighbours (k=5)",
      task, trainSize: Xtr.length, testSize: Xte.length,
      durationMs: ms, predictions: preds, actuals: yte,
    };
    if (task === "regression") {
      Object.assign(result, regressionMetrics(yte, preds));
    } else {
      Object.assign(result, classificationMetrics(yte, preds, classes));
      result.classes = classes.map(String);
    }
    models.push(result);
  }

  // ── Naive Bayes / Mean Baseline ──────────────────────────────────────────────
  {
    const t0 = performance.now();
    let preds: number[];
    let modelName: string;
    if (task === "classification") {
      preds = naiveBayes(Xtrn, ytr, Xten, classes);
      modelName = "Naive Bayes (Gaussian)";
    } else {
      // Mean baseline for regression
      const m = mean(ytr);
      preds = yte.map(() => m);
      modelName = "Mean Baseline";
    }
    const ms = performance.now() - t0;
    const result: ModelResult = {
      name: modelName,
      task, trainSize: Xtr.length, testSize: Xte.length,
      durationMs: ms, predictions: preds, actuals: yte,
    };
    if (task === "regression") {
      Object.assign(result, regressionMetrics(yte, preds));
    } else {
      Object.assign(result, classificationMetrics(yte, preds, classes));
      result.classes = classes.map(String);
    }
    models.push(result);
  }

  // ── Decision Tree ────────────────────────────────────────────────────────────
  {
    const t0 = performance.now();
    const tree = buildTree(Xtrn, ytr, 0, 6, task);
    const preds = Xten.map(row => predictTree(tree, row));
    // For classification round to nearest class
    const clsPreds = task === "classification"
      ? preds.map(p => classes.reduce((best, c) => Math.abs(c - p) < Math.abs(best - p) ? c : best))
      : preds;
    const ms = performance.now() - t0;
    const result: ModelResult = {
      name: "Decision Tree (CART)",
      task, trainSize: Xtr.length, testSize: Xte.length,
      durationMs: ms, predictions: clsPreds, actuals: yte, featureImportance: fi,
    };
    if (task === "regression") {
      Object.assign(result, regressionMetrics(yte, clsPreds));
    } else {
      Object.assign(result, classificationMetrics(yte, clsPreds, classes));
      result.classes = classes.map(String);
    }
    models.push(result);
  }

  return { task, targetColumn: targetCol, featureColumns: featureCols, models, trainSize: Xtr.length, testSize: Xte.length };
}
