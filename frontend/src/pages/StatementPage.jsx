import { PageShell } from "../components/PageShell";

const items = [
  { id: 1, label: "Consultation fee", amount: 500, status: "PAID", date: "Mar 25, 2026" },
  { id: 2, label: "Lab tests", amount: 1200, status: "DUE", date: "Mar 27, 2026" },
];

export default function StatementPage() {
  const total = items.reduce((s, i) => s + i.amount, 0);
  return (
    <PageShell title="Statement" subtitle="Payments, dues, and billing summary." actions={<button className="btn btn-primary">Pay now</button>}>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <div className="card-header">
            <div>
              <div className="text-sm font-semibold text-slate-900">Summary</div>
              <div className="mt-1 text-xs text-slate-500">This month</div>
            </div>
          </div>
          <div className="card-body">
            <div className="text-xs font-semibold text-slate-600">Total</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">₹{total}</div>
            <div className="mt-3 text-xs text-slate-500">Prototype billing. Will connect to backend later.</div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="card-header">
            <div>
              <div className="text-sm font-semibold text-slate-900">Transactions</div>
              <div className="mt-1 text-xs text-slate-500">Recent items</div>
            </div>
          </div>
          <div className="card-body space-y-3">
            {items.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{i.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{i.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">₹{i.amount}</span>
                  <span className={i.status === "PAID" ? "badge badge-green" : "badge badge-amber"}>{i.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

