import { AlertTriangle, CheckCircle2, SkipForward, Zap } from "lucide-react";
import { useMemo } from "react";
import { cn } from "../lib/cn";
import { useActivityFeed } from "../hooks/useActivityFeed";

function activityMeta(type) {
  switch (type) {
    case "PATIENT_CHECKED_IN":
      return { icon: CheckCircle2, label: "Patient checked in", tone: "badge-blue", dotBg: "bg-brand-50 dark:bg-brand-900/40" };
    case "TOKEN_CALLED":
      return { icon: Zap, label: "Token called", tone: "badge-blue", dotBg: "bg-brand-50 dark:bg-brand-900/40" };
    case "EMERGENCY_ADDED":
      return { icon: AlertTriangle, label: "Emergency case added", tone: "badge-red", dotBg: "bg-rose-50 dark:bg-rose-900/30" };
    case "QUEUE_SKIPPED":
      return { icon: SkipForward, label: "Queue skipped", tone: "badge-amber", dotBg: "bg-amber-50 dark:bg-amber-900/30" };
    default:
      return { icon: CheckCircle2, label: "Activity", tone: "", dotBg: "bg-slate-100 dark:bg-slate-800" };
  }
}

function formatLine(type, payload) {
  const name = payload?.patientName || "Patient";
  if (type === "TOKEN_CALLED") return `${name} • Token #${payload?.tokenNo ?? "—"} called`;
  if (type === "PATIENT_CHECKED_IN") return `${name} checked in • Token #${payload?.tokenNo ?? "—"}`;
  if (type === "EMERGENCY_ADDED") return `${name} • Emergency prioritized`;
  if (type === "QUEUE_SKIPPED") return `${name} • Skipped (Token #${payload?.tokenNo ?? "—"})`;
  return payload?.message || payload?.reason || "—";
}

export function ActivityFeed({ maxItems = 15 }) {
  const { items } = useActivityFeed({ maxItems });

  const content = useMemo(() => {
    return items.map((evt) => {
      const type = evt.type;
      const meta = activityMeta(type);
      const Icon = meta.icon;
      return (
        <div key={evt.id} className="rounded-2xl border border-slate-200 bg-white p-4 animate-popIn dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
                <div className={cn("mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl", meta.dotBg)}>
                <Icon className="h-4 w-4 text-slate-900 dark:text-slate-100" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("badge", meta.tone)}>{meta.label}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatLine(type, evt.payload)}</div>
              </div>
            </div>
          </div>
        </div>
      );
    });
  }, [items]);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Real-time Activity</div>
          <div className="mt-1 text-xs text-slate-500">What’s happening right now</div>
        </div>
        <span className="badge badge-amber">Live</span>
      </div>
      <div className="card-body space-y-3">{content.length ? content : <div className="text-sm text-slate-500">Waiting for updates…</div>}</div>
    </div>
  );
}

