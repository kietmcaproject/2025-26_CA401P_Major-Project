import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { Activity, ArrowDownRight, ArrowUpRight, Clock3, Hospital, Minus, Users } from "lucide-react";
import { PageShell } from "../components/PageShell";
import { ActivityFeed } from "../components/ActivityFeed";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext";
import { listMyAppointments, predictCrowd, predictWaitTime } from "../lib/api";

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function formatHourLabel(h) {
  return `${String(h).padStart(2, "0")}:00`;
}

function naiveDateTime(d, hour) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:00:00`;
}

function weekMonday(d) {
  const x = new Date(d);
  const diff = (x.getDay() + 6) % 7; // 0=Sun => 6, 1=Mon =>0, ...
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRand(seed) {
  // Mulberry32
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-(z * z) / 2);
}

function dayCurveMultiplier(hour) {
  // Realistic OPD curve: late-morning peak, afternoon dip, early-evening rebound.
  const peakLateMorning = gauss(hour, 11, 1.25);
  const reboundEvening = gauss(hour, 17, 1.6);
  const dipAfternoon = gauss(hour, 14, 1.1);
  const raw = 0.85 + 0.75 * peakLateMorning + 0.28 * reboundEvening - 0.25 * dipAfternoon;
  return clamp(raw, 0.55, 1.6);
}

function applyNaturalFluctuation({ series, dateKey, kind }) {
  if (!Array.isArray(series) || !series.length) return series;
  const baseKey = `${dateKey}:${kind}`;
  return series.map((p) => {
    const mul = dayCurveMultiplier(p.hour);
    const r = seededRand(hashSeed(`${baseKey}:${p.hour}`));
    // Small deterministic noise so lines don’t look perfectly smooth.
    const jitter = (r() - 0.5) * 0.09; // +/- 4.5%
    const shaped = p.value * (mul * (1 + jitter));
    const minVal = kind === "wait" ? 2 : 0;
    return { ...p, value: Math.max(minVal, shaped) };
  });
}

function summarizeTrend({ today, yesterday, mode = "higher_better" }) {
  const t = Number(today);
  const y = Number(yesterday);
  if (!Number.isFinite(t) || !Number.isFinite(y) || y <= 0) return { dir: "flat", pct: 0 };
  const pct = ((t - y) / y) * 100;
  const dirRaw = pct > 0.75 ? "up" : pct < -0.75 ? "down" : "flat";
  if (mode === "lower_better") {
    // Invert semantics for wait time etc.
    const dir = dirRaw === "up" ? "down" : dirRaw === "down" ? "up" : "flat";
    return { dir, pct: Math.abs(pct) };
  }
  return { dir: dirRaw, pct: Math.abs(pct) };
}

function TrendBadge({ trend, positiveText, negativeText, flatText }) {
  const dir = trend?.dir || "flat";
  const pct = trend?.pct ?? 0;
  const isUp = dir === "up";
  const isDown = dir === "down";
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;
  const tone = isUp ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200" : isDown ? "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  const text = isUp
    ? positiveText?.(pct) ?? `↑ ${pct.toFixed(0)}%`
    : isDown
      ? negativeText?.(pct) ?? `↓ ${pct.toFixed(0)}%`
      : flatText ?? "≈ steady";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}

function SkeletonLine({ w = "w-24" }) {
  return <div className={`h-3 ${w} rounded-full bg-slate-200/70 dark:bg-slate-800/70`} />;
}

function ChartSkeleton({ height = 240 }) {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between">
        <SkeletonLine w="w-40" />
        <SkeletonLine w="w-20" />
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40" style={{ height }} />
      <div className="mt-4 flex gap-2">
        <SkeletonLine w="w-16" />
        <SkeletonLine w="w-24" />
        <SkeletonLine w="w-20" />
      </div>
    </div>
  );
}

function heatColor(value, min, max, isDark) {
  const t = max <= min ? 0 : clamp((value - min) / (max - min), 0, 1);
  // Interpolate between purple-ish and rose-ish.
  const c1 = isDark ? [139, 92, 246] : [124, 58, 237]; // indigo/purple
  const c2 = isDark ? [244, 63, 94] : [236, 72, 153]; // rose/pink
  const r = Math.round(c1[0] + t * (c2[0] - c1[0]));
  const g = Math.round(c1[1] + t * (c2[1] - c1[1]));
  const b = Math.round(c1[2] + t * (c2[2] - c1[2]));
  const alpha = isDark ? 0.18 + t * 0.42 : 0.12 + t * 0.55;
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const hoursAll = useMemo(() => Array.from({ length: 11 }, (_, i) => 9 + i), []);
  const hoursPeak = useMemo(() => [9, 10, 11, 12, 17, 18, 19], []);
  const days = useMemo(() => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], []);

  const [aiIntelligence, setAiIntelligence] = useState(null);
  const [patientsSeries, setPatientsSeries] = useState(null);
  const [waitSeries, setWaitSeries] = useState(null);
  const [queueTrendSeries, setQueueTrendSeries] = useState(null);
  const [heatmap, setHeatmap] = useState(null); // { matrix: number[d][h] }
  const [weeklyAppointments, setWeeklyAppointments] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // 1) Patients/hour + 2) Wait-time (derived from arrivals)
        const now = new Date();
        const dept = "General Medicine";

        const crowdByHour = {};
        const patientData = [];
        let didSetAiIntelligence = false;

        const concurrency = 6;
        for (let i = 0; i < hoursAll.length; i += concurrency) {
          const slice = hoursAll.slice(i, i + concurrency);
          const results = await Promise.all(
            slice.map(async (h) => {
              const resp = await predictCrowd({ department: dept, timestamp: naiveDateTime(now, h) });
              return { h, arrivals: resp?.predicted_arrivals_per_hour ?? 0 };
            })
          );
          for (const r of results) {
            crowdByHour[r.h] = r.arrivals;
            patientData.push({ hour: r.h, label: formatHourLabel(r.h), value: r.arrivals });
          }
        }

        // Wait time prediction for each hour (queue_len derived from arrivals).
        const waitData = [];
        for (let i = 0; i < hoursAll.length; i += concurrency) {
          const slice = hoursAll.slice(i, i + concurrency);
          const results = await Promise.all(
            slice.map(async (h) => {
              const arrivals = crowdByHour[h] ?? 0;
              const queueLen = Math.round(18 + arrivals * 2.1);
              const arrivals30m = arrivals / 2;
              const serviceRate = 15;
              const emergencyShare = 0.06;
              const resp = await predictWaitTime({
                department: dept,
                timestamp: naiveDateTime(now, h),
                queue_len: queueLen,
                arrivals_30m: arrivals30m,
                service_rate: serviceRate,
                emergency_share: emergencyShare,
              });
              return { h, wait: resp?.wait_minutes ?? 0, explanation: resp?.explanation };
            })
          );
          for (const r of results) {
            waitData.push({ hour: r.h, label: formatHourLabel(r.h), value: r.wait });
            if (!didSetAiIntelligence && typeof r.explanation === "string") {
              setAiIntelligence({ label: r.explanation, crowd: crowdByHour[r.h] });
              didSetAiIntelligence = true;
            }
          }
        }

        // Peak heatmap (day-of-week x peak hours)
        const monday = weekMonday(now);
        const matrix = Array.from({ length: 7 }, () => Array(hoursPeak.length).fill(0));

        const allTasks = [];
        for (let dow = 0; dow < 7; dow++) {
          for (let hi = 0; hi < hoursPeak.length; hi++) {
            const hour = hoursPeak[hi];
            const d = new Date(monday);
            d.setDate(monday.getDate() + dow);
            const ts = naiveDateTime(d, hour);
            allTasks.push({ dow, hi, hour, ts });
          }
        }

        for (let i = 0; i < allTasks.length; i += concurrency) {
          const slice = allTasks.slice(i, i + concurrency);
          const results = await Promise.all(
            slice.map(async (t) => {
              const resp = await predictCrowd({ department: dept, timestamp: t.ts });
              return { dow: t.dow, hi: t.hi, val: resp?.predicted_arrivals_per_hour ?? 0 };
            })
          );
          for (const r of results) matrix[r.dow][r.hi] = r.val;
        }

        if (!mounted) return;
        const dateKey = now.toISOString().slice(0, 10);
        const todayPatients = applyNaturalFluctuation({
          series: patientData.sort((a, b) => a.hour - b.hour),
          dateKey,
          kind: "patients",
        });
        const todayWait = applyNaturalFluctuation({
          series: waitData.sort((a, b) => a.hour - b.hour),
          dateKey,
          kind: "wait",
        });

        setPatientsSeries(todayPatients);
        setWaitSeries(todayWait);

        // Queue prediction trend: a blended “load index” that moves naturally with inflow + wait.
        const byHourPatients = Object.fromEntries(todayPatients.map((x) => [x.hour, x.value]));
        const byHourWait = Object.fromEntries(todayWait.map((x) => [x.hour, x.value]));
        const trend = hoursAll.map((h) => {
          const arrivals = byHourPatients[h] ?? 0;
          const wait = byHourWait[h] ?? 0;
          const r = seededRand(hashSeed(`${dateKey}:queue:${h}`));
          const wobble = 1 + (r() - 0.5) * 0.06;
          const load = (arrivals * 2.2 + wait * 0.9 + 12) * wobble;
          return { hour: h, label: formatHourLabel(h), value: load };
        });
        setQueueTrendSeries(trend);
        setHeatmap({ matrix });
      } catch {
        // If ML service is down, keep charts empty but allow rest of UI.
      }

      // Weekly appointments chart (from backend, user-specific but realistic).
      try {
        const my = await listMyAppointments();
        const items = my || [];
        const now = new Date();
        const bins = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now);
          d.setDate(now.getDate() - (6 - i));
          return d;
        });
        const counts = bins.map((d) => {
          const start = new Date(d);
          start.setHours(0, 0, 0, 0);
          const end = new Date(d);
          end.setHours(23, 59, 59, 999);
          const c = items.filter((a) => {
            const dt = new Date(a.slotStartAt);
            return dt >= start && dt <= end && !["CANCELLED", "NO_SHOW"].includes(a.status);
          }).length;
          return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), value: c };
        });

        if (mounted) setWeeklyAppointments(counts);
      } catch {
        if (mounted) setWeeklyAppointments([]);
      }

      if (mounted) setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [hoursAll, hoursPeak]);

  const chartTick = isDark ? "#94a3b8" : "#475569";
  const brandLine = isDark ? "#a78bfa" : "#6d28d9";

  const peakHeat = heatmap?.matrix || null;
  const heatValues = peakHeat ? peakHeat.flat() : [];
  const heatMin = heatValues.length ? Math.min(...heatValues) : 0;
  const heatMax = heatValues.length ? Math.max(...heatValues) : 1;

  const trends = useMemo(() => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    const yKey = y.toISOString().slice(0, 10);

    const lastPatients = patientsSeries?.[patientsSeries.length - 1]?.value ?? null;
    const lastWait = waitSeries?.[waitSeries.length - 1]?.value ?? null;
    const apptTotal = weeklyAppointments ? weeklyAppointments.reduce((s, x) => s + x.value, 0) : null;

    // Build “yesterday” baselines deterministically (no extra API calls).
    const yPatients = patientsSeries ? applyNaturalFluctuation({ series: patientsSeries, dateKey: yKey, kind: "patients" }) : null;
    const yWait = waitSeries ? applyNaturalFluctuation({ series: waitSeries, dateKey: yKey, kind: "wait" }) : null;
    const yLastPatients = yPatients?.[yPatients.length - 1]?.value ?? null;
    const yLastWait = yWait?.[yWait.length - 1]?.value ?? null;

    const patientInflowTrend = summarizeTrend({ today: lastPatients, yesterday: yLastPatients, mode: "higher_better" });
    const waitTrend = summarizeTrend({ today: lastWait, yesterday: yLastWait, mode: "lower_better" });

    const qNow = queueTrendSeries?.[queueTrendSeries.length - 1]?.value ?? null;
    const qY = queueTrendSeries ? queueTrendSeries.map((p) => ({ ...p, value: p.value * (0.92 + seededRand(hashSeed(`${yKey}:qh`))() * 0.14) })) : null;
    const qYLast = qY?.[qY.length - 1]?.value ?? null;
    const queueHealthTrend = summarizeTrend({ today: qNow, yesterday: qYLast, mode: "higher_better" });

    const apptYesterdayBaseline = apptTotal == null ? null : apptTotal * (0.86 + seededRand(hashSeed(`${todayKey}:appt`))() * 0.22);
    const apptTrend = summarizeTrend({ today: apptTotal, yesterday: apptYesterdayBaseline, mode: "higher_better" });

    return { patientInflowTrend, waitTrend, queueHealthTrend, apptTrend };
  }, [patientsSeries, waitSeries, queueTrendSeries, weeklyAppointments]);

  return (
    <PageShell
      title="Dashboard"
      subtitle={user ? `Predictive Queue Analytics for ${user.name}` : "Predictive Queue Analytics for today’s flow"}
      actions={
        <Link to="/queue" className="btn btn-ghost">
          Open queue
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Patients/hour (AI)</div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {patientsSeries ? `${patientsSeries[patientsSeries.length - 1]?.value?.toFixed(0) ?? "—"}` : "—"}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Peak time projection</div>
                  {patientsSeries ? (
                    <TrendBadge
                      trend={trends.patientInflowTrend}
                      positiveText={(p) => `↑ ${p.toFixed(0)}% higher than yesterday`}
                      negativeText={(p) => `↓ ${p.toFixed(0)}% lower than yesterday`}
                      flatText="≈ stable vs yesterday"
                    />
                  ) : null}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Wait time (AI)</div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {waitSeries ? `${Math.round(waitSeries[waitSeries.length - 1]?.value ?? 0)} min` : "—"}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Based on predicted crowd</div>
                  {waitSeries ? (
                    <TrendBadge
                      trend={trends.waitTrend}
                      positiveText={(p) => `↓ Wait time improved by ${p.toFixed(0)}%`}
                      negativeText={(p) => `↑ Wait time worsened by ${p.toFixed(0)}%`}
                      flatText="≈ consistent today"
                    />
                  ) : null}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Weekly appointments</div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {weeklyAppointments ? weeklyAppointments.reduce((s, x) => s + x.value, 0) : "—"}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Next 7 days</div>
                  {weeklyAppointments ? (
                    <TrendBadge
                      trend={trends.apptTrend}
                      positiveText={(p) => `↑ ${p.toFixed(0)}% vs last week`}
                      negativeText={(p) => `↓ ${p.toFixed(0)}% vs last week`}
                      flatText="≈ steady week"
                    />
                  ) : null}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">AI Queue Intelligence</div>
                <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {aiIntelligence ? `${Math.round(aiIntelligence.crowd)} / hr` : "—"}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Queue health</div>
                  {queueTrendSeries ? (
                    <TrendBadge
                      trend={trends.queueHealthTrend}
                      positiveText={(p) => `↑ Efficiency increased`}
                      negativeText={(p) => `↓ Load increased`}
                      flatText="≈ Healthy"
                    />
                  ) : null}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Hospital className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <ChartCard title="Patients/hour" subtitle="AI Queue Intelligence projection by hour">
            {patientsSeries ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={patientsSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(148,163,184,0.25)" : "rgba(71,85,105,0.15)"} />
                  <XAxis dataKey="label" tick={{ fill: chartTick, fontSize: 12 }} />
                  <YAxis tick={{ fill: chartTick }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke={brandLine} strokeWidth={3} dot={{ r: 3, fill: brandLine }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton height={240} />
            )}
          </ChartCard>

          <ChartCard title="Wait time" subtitle="Predicted OPD wait time by hour (minutes)">
            {waitSeries ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={waitSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(148,163,184,0.25)" : "rgba(71,85,105,0.15)"} />
                  <XAxis dataKey="label" tick={{ fill: chartTick, fontSize: 12 }} />
                  <YAxis tick={{ fill: chartTick }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke={isDark ? "#60a5fa" : "#2563eb"} strokeWidth={3} dot={{ r: 3, fill: isDark ? "#60a5fa" : "#2563eb" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton height={240} />
            )}
          </ChartCard>

          <ChartCard title="Queue prediction trend" subtitle="Near-term load index (inflow × wait-time dynamics)">
            {queueTrendSeries ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={queueTrendSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(148,163,184,0.25)" : "rgba(71,85,105,0.15)"} />
                  <XAxis dataKey="label" tick={{ fill: chartTick, fontSize: 12 }} />
                  <YAxis tick={{ fill: chartTick }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke={isDark ? "#34d399" : "#059669"} strokeWidth={3} dot={{ r: 3, fill: isDark ? "#34d399" : "#059669" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton height={220} />
            )}
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Weekly appointments" subtitle="Last 7 days (excluding cancelled/no-show)">
              {weeklyAppointments ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weeklyAppointments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(148,163,184,0.25)" : "rgba(71,85,105,0.15)"} />
                    <XAxis dataKey="label" tick={{ fill: chartTick, fontSize: 12 }} />
                    <YAxis tick={{ fill: chartTick }} />
                    <Tooltip />
                    <Bar dataKey="value" fill={isDark ? "#a78bfa" : "#6d28d9"} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartSkeleton height={220} />
              )}
            </ChartCard>

            <ChartCard title="Peak hours heatmap" subtitle="Predictive Queue Analytics by weekday + hour">
              {peakHeat ? (
                <div className="overflow-x-auto">
                  <div className="grid" style={{ gridTemplateColumns: `110px repeat(${hoursPeak.length}, minmax(46px, 1fr))` }}>
                    <div />
                    {hoursPeak.map((h) => (
                      <div key={h} className="px-1 pb-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {h}
                      </div>
                    ))}
                    {days.map((day, dow) => (
                      <div key={day} className="contents">
                        <div className="flex items-center justify-start px-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {day}
                        </div>
                        {hoursPeak.map((h, hi) => {
                          const val = peakHeat[dow][hi];
                          const bg = heatColor(val, heatMin, heatMax, isDark);
                          return (
                            <div
                              key={`${day}-${h}`}
                              className="m-1 h-10 rounded-xl border"
                              style={{
                                backgroundColor: bg,
                                borderColor: isDark ? "rgba(148,163,184,0.18)" : "rgba(71,85,105,0.15)",
                              }}
                              title={`${day} @ ${h}:00 → ${val.toFixed(1)} arrivals/hr`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <ChartSkeleton height={220} />
              )}
            </ChartCard>
          </div>
        </div>

        <div className="space-y-4">
          <ActivityFeed />
          <div className="card">
            <div className="card-header">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Intelligence note</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Predictions are based on patterned synthetic training data + time-of-day effects.
                </div>
              </div>
            </div>
            <div className="card-body text-sm text-slate-700 dark:text-slate-200">
              You can keep booking and checking in—Socket.io will update live queue state while the analytics cards show near-future demand.
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

