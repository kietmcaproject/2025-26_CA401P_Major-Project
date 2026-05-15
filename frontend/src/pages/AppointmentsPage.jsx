import { PageShell } from "../components/PageShell";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkInAppointment, listMyAppointments } from "../lib/api";

function Row({ a, onJoinQueue, onCheckIn }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div>
        <div className="text-sm font-semibold text-slate-900">{a.doctorName}</div>
        <div className="mt-1 text-xs text-slate-500">
          {a.department} • {new Date(a.slotStartAt).toLocaleString()}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="badge badge-blue">{a.status}</span>
        {a.status === "BOOKED" ? (
          <button className="btn btn-ghost" onClick={() => onCheckIn(a)}>
            Check-in
          </button>
        ) : null}
        {a.slotStartAt ? (
          <button className="btn btn-ghost" onClick={() => onJoinQueue(a)}>
            Queue
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listMyAppointments();
        if (mounted) setItems(data);
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const [upcoming, history] = useMemo(() => {
    const now = Date.now();
    const up = items.filter((a) => new Date(a.slotStartAt).getTime() >= now && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status));
    const hi = items.filter((a) => !up.includes(a));
    return [up, hi];
  }, [items]);

  function goQueue(a) {
    nav(`/queue?doctorId=${encodeURIComponent(a.doctorId)}&slotStartAt=${encodeURIComponent(a.slotStartAt)}`);
  }

  async function onCheckIn(a) {
    try {
      await checkInAppointment(a.id);
      const refreshed = await listMyAppointments();
      setItems(refreshed);
      goQueue(a);
    } catch {
      // noop: keep UI responsive even if check-in fails
    }
  }

  return (
    <PageShell
      title="Appointments"
      subtitle="Upcoming visits and consultation history."
      actions={<button className="btn btn-primary" onClick={() => nav("/book")}>Book new</button>}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="text-sm font-semibold text-slate-900">Upcoming</div>
              <div className="mt-1 text-xs text-slate-500">Next visits</div>
            </div>
          </div>
          <div className="card-body space-y-3">
            {loading ? <div className="text-sm text-slate-500">Loading…</div> : null}
            {upcoming.map((a) => (
              <Row key={a.id} a={a} onJoinQueue={goQueue} onCheckIn={onCheckIn} />
            ))}
            {!loading && upcoming.length === 0 ? <div className="text-sm text-slate-500">No upcoming appointments.</div> : null}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="text-sm font-semibold text-slate-900">History</div>
              <div className="mt-1 text-xs text-slate-500">Past consultations</div>
            </div>
          </div>
          <div className="card-body space-y-3">
            {history.map((a) => (
              <Row key={a.id} a={a} onJoinQueue={goQueue} onCheckIn={onCheckIn} />
            ))}
            {!loading && history.length === 0 ? <div className="text-sm text-slate-500">No history yet.</div> : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

