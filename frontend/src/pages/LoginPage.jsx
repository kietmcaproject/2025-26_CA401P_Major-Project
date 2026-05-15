import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await signup(name, email, password, phone || undefined);
      nav(loc.state?.from || "/", { replace: true });
    } catch (error) {
      setErr(error.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="text-lg font-bold text-slate-900">Hospital Queue</div>
              <div className="mt-1 text-xs text-slate-500">Login/signup to continue</div>
            </div>
          </div>
          <form className="card-body space-y-3" onSubmit={onSubmit}>
            {mode === "signup" ? (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Name</label>
                  <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Phone (optional)</label>
                  <input className="input mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </>
            ) : null}
            <div>
              <label className="text-xs font-semibold text-slate-700">Email</label>
              <input
                type="email"
                className="input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <input
                type="password"
                className="input mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {err ? <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div> : null}
            <button disabled={busy} className="btn btn-primary w-full" type="submit">
              {busy ? "Please wait…" : mode === "login" ? "Login" : "Create account"}
            </button>
            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
            >
              {mode === "login" ? "Need an account? Sign up" : "Already registered? Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

