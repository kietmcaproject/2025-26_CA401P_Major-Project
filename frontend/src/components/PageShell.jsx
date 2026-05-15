import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function PageShell({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-full">
      <div className="flex min-h-full">
        <Sidebar />
        <div className="flex min-h-full flex-1 flex-col">
          <Topbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
              </div>
              {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

