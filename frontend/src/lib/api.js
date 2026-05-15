const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  if (!token) localStorage.removeItem("token");
  else localStorage.setItem("token", token);
}

export async function apiFetch(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  const t = token || getToken();
  if (t) headers.Authorization = `Bearer ${t}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.error?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json?.data ?? json;
}

export async function listDoctors() {
  return apiFetch("/api/doctors");
}

export async function predictWaitTime(body) {
  return apiFetch("/api/predict/wait-time", { method: "POST", body });
}

export async function predictCrowd(body) {
  return apiFetch("/api/predict/crowd", { method: "POST", body });
}

export async function login(body) {
  return apiFetch("/api/auth/login", { method: "POST", body, token: null });
}

export async function signup(body) {
  return apiFetch("/api/auth/signup", { method: "POST", body, token: null });
}

export async function getMe() {
  return apiFetch("/api/auth/me");
}

export async function bookAppointment(body) {
  return apiFetch("/api/appointments/book", { method: "POST", body });
}

export async function listMyAppointments() {
  return apiFetch("/api/appointments/mine");
}

export async function checkInAppointment(appointmentId) {
  return apiFetch("/api/appointments/check-in", { method: "POST", body: { appointmentId } });
}

export async function callNext({ doctorId, slotStartAt }) {
  return apiFetch("/api/queues/next", { method: "POST", body: { doctorId, slotStartAt } });
}

export async function markNoShow({ doctorId, slotStartAt, queueEntryId }) {
  return apiFetch("/api/queues/no-show", {
    method: "POST",
    body: { doctorId, slotStartAt, queueEntryId },
  });
}

export async function skipQueueEntry({ doctorId, slotStartAt, queueEntryId, reason }) {
  return apiFetch("/api/queues/skip", {
    method: "POST",
    body: { doctorId, slotStartAt, queueEntryId, reason },
  });
}

