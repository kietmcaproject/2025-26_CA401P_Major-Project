import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { getSocket } from "../lib/socket";

export function useQueueLive({ doctorId, slotStartAt }) {
  const [queue, setQueue] = useState(null);
  const [seq, setSeq] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const key = useMemo(() => {
    if (!doctorId || !slotStartAt) return null;
    const iso = typeof slotStartAt === "string" ? new Date(slotStartAt).toISOString() : slotStartAt.toISOString();
    return { doctorId, slotStartAtIso: iso };
  }, [doctorId, slotStartAt]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!key) {
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const q = await apiFetch(`/api/queues?doctorId=${key.doctorId}&slotStartAt=${encodeURIComponent(key.slotStartAtIso)}`);
        if (mounted) setQueue(q);
      } catch (e) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, [key]);

  useEffect(() => {
    if (!key) return;
    const socket = getSocket();

    socket.emit("join", { doctorId: key.doctorId, slotStartAt: key.slotStartAtIso });

    const onUpdated = (payload) => {
      if (payload?.doctorId !== key.doctorId) return;
      if (payload?.slotStartAt !== key.slotStartAtIso) return;
      setQueue(payload.queue);
      setSeq((s) => s + 1);
    };

    socket.on("queue:updated", onUpdated);
    return () => {
      socket.off("queue:updated", onUpdated);
    };
  }, [key]);

  return { queue, setQueue, loading, error, seq };
}

