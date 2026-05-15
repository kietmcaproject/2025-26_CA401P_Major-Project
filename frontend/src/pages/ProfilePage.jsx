import { PageShell } from "../components/PageShell";
import { useAuth } from "../auth/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <PageShell title="Profile" subtitle="Personal details, preferences, and security.">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-slate-100" />
              <div>
                <div className="text-sm font-bold text-slate-900">{user?.name || "User"}</div>
                <div className="mt-1 text-xs text-slate-500">{user?.role || "PATIENT"}</div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-800">Phone:</span> {user?.phone || "—"}
              </div>
              <div>
                <span className="font-semibold text-slate-800">Email:</span> {user?.email || "—"}
              </div>
              <div>
                <span className="font-semibold text-slate-800">Status:</span> {user?.isActive ? "Active" : "Pending"}
              </div>
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="card-header">
            <div>
              <div className="text-sm font-semibold text-slate-900">Settings</div>
              <div className="mt-1 text-xs text-slate-500">Update info</div>
            </div>
          </div>
          <div className="card-body space-y-3">
            <div className="grid gap-3 lg:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Name</label>
                <input className="input mt-2" defaultValue={user?.name || ""} readOnly />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Phone</label>
                <input className="input mt-2" defaultValue={user?.phone || ""} readOnly />
              </div>
              <div className="lg:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Email</label>
                <input className="input mt-2" defaultValue={user?.email || ""} readOnly />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="btn btn-primary" disabled>
                Save (coming soon)
              </button>
              <button className="btn btn-ghost" disabled>
                Change password
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

