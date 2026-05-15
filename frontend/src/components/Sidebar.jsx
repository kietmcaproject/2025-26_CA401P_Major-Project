import { NavLink } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  LayoutDashboard,
  ListOrdered,
  ReceiptIndianRupee,
  UserCircle2,
} from "lucide-react";
import { cn } from "../lib/cn";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/book", label: "Book Appointment", icon: CalendarDays },
  { to: "/queue", label: "Queue", icon: ListOrdered },
  { to: "/appointments", label: "Appointments", icon: Activity },
  { to: "/statement", label: "Statement", icon: ReceiptIndianRupee },
  { to: "/profile", label: "Profile", icon: UserCircle2 },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:gap-6 lg:border-r lg:border-slate-200 lg:bg-white dark:lg:border-slate-800 dark:lg:bg-slate-950">
      <div className="px-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <span className="text-sm font-bold">HQ</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">Hospital Queue</div>
            <div className="text-xs text-slate-500">AI-enhanced ops</div>
          </div>
        </div>
      </div>

      <nav className="px-3">
        <ul className="space-y-1">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold",
                      isActive
                        ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200 dark:bg-brand-900/40 dark:text-brand-200 dark:ring-brand-400/30"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto px-6 pb-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-600">Tip</div>
          <div className="mt-1 text-xs text-slate-600">
            Use <span className="font-semibold text-slate-800">Book Appointment</span> to get AI doctor suggestions.
          </div>
        </div>
      </div>
    </aside>
  );
}

