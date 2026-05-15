import { useEffect, useMemo, useState } from "react";
import { Sparkles, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "../components/PageShell";
import { cn } from "../lib/cn";
import { mockDoctors } from "../mock/data";
import { recommendDoctors } from "../lib/recommendations";
import { bookAppointment, listDoctors, predictWaitTime } from "../lib/api";

function DoctorCard({ d, isRecommended, onSelect, selected, ml }) {
  const wait = ml?.wait_minutes ?? d.predictedWaitMins;
  const waitLabel = typeof wait === "number" ? `${Math.round(wait)} min (ML)` : `${d.predictedWaitMins} min`;
  return (
    <button
      type="button"
      onClick={() => onSelect(d.id)}
      className={cn(
        "w-full text-left rounded-2xl border p-4 transition",
        selected ? "border-brand-300 bg-brand-50" : "border-slate-200 bg-white hover:bg-slate-50",
        isRecommended ? "ring-4 ring-brand-100" : ""
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-bold text-slate-900">{d.name}</div>
            {isRecommended ? (
              <span className="badge badge-blue">
                <Sparkles className="h-3.5 w-3.5" />
                Recommended
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {d.department} • {d.specialization}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge">⭐ {d.rating}</span>
            <span
              className={cn("badge", typeof wait === "number" && wait <= 20 ? "badge-green" : "badge-amber")}
              title={ml?.explanation || ""}
            >
              ⏳ {waitLabel}
            </span>
            {d.isEmergencyCapable ? (
              <span className="badge badge-red">Emergency ready</span>
            ) : (
              <span className="badge">Standard</span>
            )}
          </div>
          {ml?.explanation ? <p className="mt-2 text-xs leading-relaxed text-slate-600">{ml.explanation}</p> : null}
        </div>
        <div className="badge">{d.nextSlotLabel}</div>
      </div>
    </button>
  );
}

export default function BookAppointment() {
  const nav = useNavigate();
  const [complaint, setComplaint] = useState("");
  const [preferredDept, setPreferredDept] = useState("");
  const [slotStartAt, setSlotStartAt] = useState(() => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [doctors, setDoctors] = useState(null);
  const [mlById, setMlById] = useState({});
  const [mlLoading, setMlLoading] = useState(false);
  const [bookState, setBookState] = useState({ busy: false, msg: "", err: "" });

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const list = await listDoctors();
        if (!cancel) setDoctors(list.length ? list : mockDoctors);
      } catch {
        if (!cancel) setDoctors(mockDoctors);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!doctors?.length) return undefined;
    let cancel = false;
    (async () => {
      setMlLoading(true);
      const ts = new Date().toISOString();
      const next = {};
      await Promise.all(
        doctors.map(async (d, i) => {
          try {
            const qLen = 12 + ((i * 3) % 25);
            const arrivals = 6 + ((i * 2) % 8);
            const serviceRate = d.serviceRate ?? Math.min(200, Math.max(1, Math.round(60 / (d.avgServiceMinutes || 10))));
            const pred = await predictWaitTime({
              department: d.department,
              timestamp: ts,
              queue_len: qLen,
              arrivals_30m: arrivals,
              service_rate: serviceRate,
              emergency_share: d.isEmergencyCapable ? 0.08 : 0.03,
            });
            next[d.id] = pred;
          } catch {
            /* ML or API offline — omit */
          }
        })
      );
      if (!cancel) {
        setMlById(next);
        setMlLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [doctors]);

  const rec = useMemo(() => {
    if (!doctors) return { inferredDept: null, recommendedDoctorId: null, ranked: [] };
    return recommendDoctors({
      doctors,
      complaint,
      preferredDept: preferredDept || null,
      mlWaitById: mlById,
    });
  }, [doctors, complaint, preferredDept, mlById]);

  const doctorsToShow = rec.ranked;
  const recommendedId = rec.recommendedDoctorId;

  async function onBook() {
    if (!selectedDoctorId) {
      setBookState({ busy: false, msg: "", err: "Please select a doctor first." });
      return;
    }
    const start = new Date(slotStartAt);
    if (Number.isNaN(start.getTime())) {
      setBookState({ busy: false, msg: "", err: "Please choose a valid slot date/time." });
      return;
    }
    setBookState({ busy: true, msg: "", err: "" });
    try {
      const result = await bookAppointment({
        doctorId: selectedDoctorId,
        slotStartAt: start.toISOString(),
        slotEndAt: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
        reason: complaint || "General consultation",
        priorityLevel: "NORMAL",
      });
      setBookState({ busy: false, msg: "Appointment booked successfully.", err: "" });
      nav(`/queue?doctorId=${encodeURIComponent(result.doctorId)}&slotStartAt=${encodeURIComponent(result.slotStartAt)}`);
    } catch (e) {
      setBookState({ busy: false, msg: "", err: e.message || "Booking failed" });
    }
  }

  return (
    <PageShell
      title="Book Appointment"
      subtitle="Backend proxies predictions from the ML service; rankings blend symptoms + predicted wait."
      actions={
        <button className="btn btn-primary" onClick={onBook} disabled={bookState.busy}>
          {bookState.busy ? "Booking…" : "Book"}
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="text-sm font-semibold text-slate-900">Smart intake</div>
                <div className="mt-1 text-xs text-slate-500">Doctors from MongoDB when available; wait times from FastAPI.</div>
              </div>
              <span className="badge badge-blue">
                <Stethoscope className="h-3.5 w-3.5" />
                AI assist
              </span>
            </div>
            <div className="card-body space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">What are you experiencing?</label>
                <textarea
                  className="input mt-2 min-h-[90px]"
                  placeholder="e.g., fever and cough since 2 days, breathing difficulty…"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Preferred department (optional)</label>
                <select className="select mt-2" value={preferredDept} onChange={(e) => setPreferredDept(e.target.value)}>
                  <option value="">Auto-detect</option>
                  <option>General Medicine</option>
                  <option>Cardiology</option>
                  <option>Pulmonology</option>
                  <option>Dermatology</option>
                  <option>Pediatrics</option>
                  <option>Orthopedics</option>
                </select>
                <div className="mt-2 text-xs text-slate-500">
                  Detected:{" "}
                  <span className="font-semibold text-slate-800">{rec.inferredDept || "—"}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Slot start</label>
                <input
                  type="datetime-local"
                  className="input mt-2"
                  value={slotStartAt}
                  onChange={(e) => setSlotStartAt(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <div className="text-sm font-semibold text-slate-900">Selection</div>
                <div className="mt-1 text-xs text-slate-500">Recommended doctor is highlighted.</div>
              </div>
              <span className="badge badge-amber">
                {doctors == null ? "Loading doctors…" : mlLoading ? "ML predicting…" : "ML ready"}
              </span>
            </div>
            <div className="card-body">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {selectedDoctorId ? (
                  <>
                    Selected:{" "}
                    <span className="font-semibold text-slate-900">
                      {doctors?.find((d) => d.id === selectedDoctorId)?.name}
                    </span>
                  </>
                ) : (
                  <>
                    Tip: click the <span className="font-semibold text-slate-900">Recommended</span> doctor first for
                    best wait time.
                  </>
                )}
              </div>
              {bookState.msg ? <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{bookState.msg}</div> : null}
              {bookState.err ? <div className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{bookState.err}</div> : null}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card">
            <div className="card-header">
              <div>
                <div className="text-sm font-semibold text-slate-900">Doctors</div>
                <div className="mt-1 text-xs text-slate-500">Sorted by match + ML wait estimate</div>
              </div>
              {recommendedId ? (
                <span className="badge badge-blue">
                  <Sparkles className="h-3.5 w-3.5" />
                  Recommendation ready
                </span>
              ) : (
                <span className="badge">Start typing symptoms</span>
              )}
            </div>
            <div className="card-body grid gap-3">
              {doctors == null ? (
                <div className="text-sm text-slate-500">Loading doctor list…</div>
              ) : (
                doctorsToShow.map((d) => (
                  <DoctorCard
                    key={d.id}
                    d={d}
                    selected={selectedDoctorId === d.id}
                    isRecommended={recommendedId === d.id}
                    onSelect={(id) => setSelectedDoctorId(id)}
                    ml={mlById[d.id]}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
