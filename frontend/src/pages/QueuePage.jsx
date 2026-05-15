import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { QueueViz } from "../components/QueueViz";
import { mockQueue } from "../mock/data";
import { useQueueLive } from "../hooks/useQueueLive";
import { useAuth } from "../auth/AuthContext";
import { callNext, markNoShow, skipQueueEntry } from "../lib/api";

export default function QueuePage() {
  const [sp, setSp] = useSearchParams();
  const doctorIdParam = sp.get("doctorId") || "";
  const slotParam = sp.get("slotStartAt") || "";

  const [draftDoc, setDraftDoc] = useState(doctorIdParam);
  const [draftSlot, setDraftSlot] = useState(() => {
    if (slotParam) {
      try {
        const d = new Date(slotParam);
        if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 16);
      } catch {
        /* ignore */
      }
    }
    return new Date().toISOString().slice(0, 16);
  });

  const liveKey = useMemo(() => {
    if (!doctorIdParam || !slotParam) return null;
    const d = new Date(slotParam);
    if (Number.isNaN(d.getTime())) return null;
    return { doctorId: doctorIdParam, slotStartAt: d };
  }, [doctorIdParam, slotParam]);

  const { queue, loading, error, seq } = useQueueLive(
    liveKey ? { doctorId: liveKey.doctorId, slotStartAt: liveKey.slotStartAt } : { doctorId: null, slotStartAt: null }
  );

  function applyLiveParams(e) {
    e.preventDefault();
    const iso = new Date(draftSlot).toISOString();
    const next = new URLSearchParams(sp);
    next.set("doctorId", draftDoc.trim());
    next.set("slotStartAt", iso);
    setSp(next, { replace: true });
  }

  const q = queue || null;
  const { user } = useAuth();
  const canManageQueue = Boolean(user?.role) && ["DOCTOR", "RECEPTIONIST", "ADMIN"].includes(user.role);

  async function onCallNext() {
    if (!liveKey) return;
    await callNext({ doctorId: liveKey.doctorId, slotStartAt: liveKey.slotStartAt });
  }

  async function onNoShow(queueEntryId) {
    if (!liveKey) return;
    await markNoShow({ doctorId: liveKey.doctorId, slotStartAt: liveKey.slotStartAt, queueEntryId });
  }

  async function onSkip(queueEntryId) {
    if (!liveKey) return;
    await skipQueueEntry({
      doctorId: liveKey.doctorId,
      slotStartAt: liveKey.slotStartAt,
      queueEntryId,
      reason: "Skipped by staff",
    });
  }

  return (
    <PageShell
      title="Queue"
      subtitle={
        q
          ? `Live • Doctor ${q.doctorId} • ${new Date(q.slotStartAt).toLocaleString()}`
          : liveKey
            ? `Connecting… ${liveKey.doctorId}`
            : `${mockQueue.doctorName} • demo view — set Doctor ID + slot below`
      }
      actions={
        <>
          <span className="badge">{loading ? "Connecting…" : liveKey ? "Live" : "Demo"}</span>
          {error ? <span className="badge badge-red">API offline</span> : null}
          {canManageQueue && q ? (
            <button type="button" className="btn btn-primary" onClick={onCallNext}>
              Call Next
            </button>
          ) : null}
        </>
      }
    >
      <form onSubmit={applyLiveParams} className="card mb-4">
        <div className="card-header">
          <div>
            <div className="text-sm font-semibold text-slate-900">Connect to backend + Socket.io</div>
            <div className="mt-1 text-xs text-slate-500">
              Use a real MongoDB <code className="rounded bg-slate-100 px-1">doctorId</code> and the same{" "}
              <code className="rounded bg-slate-100 px-1">slotStartAt</code> as your appointments.
            </div>
          </div>
        </div>
        <div className="card-body flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[200px] flex-1">
            <label className="text-xs font-semibold text-slate-700">Doctor ID</label>
            <input
              className="input mt-1 font-mono text-xs"
              value={draftDoc}
              onChange={(e) => setDraftDoc(e.target.value)}
              placeholder="507f1f77bcf86cd799439011"
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="text-xs font-semibold text-slate-700">Slot start (local)</label>
            <input
              type="datetime-local"
              className="input mt-1"
              value={draftSlot}
              onChange={(e) => setDraftSlot(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Load live queue
          </button>
        </div>
      </form>

      {q ? (
        <QueueViz
          currentToken={q.currentTokenNo}
          updateSeq={seq}
          entries={(q.entries || []).map((e) => ({
            tokenNo: e.tokenNo,
            name: e.patientName || String(e.patientId),
            status: e.status,
            priority: e.priorityLevel,
            queueEntryId: e._id,
          }))}
          onSkip={canManageQueue ? onSkip : null}
          onNoShow={canManageQueue ? onNoShow : null}
        />
      ) : (
        <QueueViz entries={mockQueue.entries} currentToken={mockQueue.currentToken} updateSeq={0} />
      )}
    </PageShell>
  );
}
