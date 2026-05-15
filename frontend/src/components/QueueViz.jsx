import { cn } from "../lib/cn";

function statusBadge(status) {
  switch (status) {
    case "CALLED":
      return "badge badge-blue";
    case "WAITING":
      return "badge badge-amber";
    case "DONE":
      return "badge badge-green";
    case "NO_SHOW":
      return "badge badge-red";
    default:
      return "badge";
  }
}

function priorityPill(priority) {
  if (priority === "EMERGENCY") return "badge badge-red";
  if (priority === "SENIOR") return "badge badge-blue";
  return "badge";
}

export function QueueViz({ entries, currentToken, updateSeq, onSkip, onNoShow, onCallNext }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live Queue</div>
          <div className="mt-1 text-xs text-slate-500">Visual token lane + priority ordering</div>
        </div>
        <div className="badge badge-blue">Current token: {currentToken ?? "—"}</div>
      </div>
      <div className="card-body">
        <div key={updateSeq ?? 0} className="grid gap-3 animate-popIn">
          {entries.map((e) => (
            <div
              key={e.tokenNo}
              className={cn(
                "flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition-all",
                e.tokenNo === currentToken ? "border-brand-300 bg-brand-50" : "border-slate-200 bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold",
                    e.priority === "EMERGENCY" ? "bg-rose-600 text-white" : "bg-slate-900 text-white",
                    e.tokenNo === currentToken && e.status === "CALLED" ? "token-pulse ring-4 ring-rose-200" : ""
                  )}
                >
                  {e.tokenNo}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{e.name}</div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className={priorityPill(e.priority)}>{e.priority}</span>
                    <span className={statusBadge(e.status)}>{e.status}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-xs text-slate-500 hidden sm:block">
                  {e.tokenNo === currentToken ? "In progress / called" : "In lane"}
                </div>
                {e.queueEntryId && (e.status === "WAITING" || e.status === "CALLED") ? (
                  <div className="flex items-center gap-2">
                    {onSkip ? (
                      <button
                        type="button"
                        className="btn btn-ghost px-3 py-1 text-xs"
                        onClick={() => onSkip(e.queueEntryId)}
                        title="Skip this token"
                      >
                        <span className="hidden sm:inline">Skip</span>
                        <span className="sm:hidden">S</span>
                      </button>
                    ) : null}
                    {onNoShow ? (
                      <button
                        type="button"
                        className="btn btn-ghost px-3 py-1 text-xs"
                        onClick={() => onNoShow(e.queueEntryId)}
                        title="Mark as no-show"
                      >
                        <span className="hidden sm:inline">No-show</span>
                        <span className="sm:hidden">N</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

