const { env } = require("../config/env");

async function postJson(path, body) {
  const base = env.mlServiceUrl.replace(/\/$/, "");
  const url = `${base}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    const detail = json?.detail;
    const detailMsg =
      Array.isArray(detail) && detail[0]?.msg
        ? detail[0].msg
        : typeof detail === "string"
          ? detail
          : null;
    const err = new Error(detailMsg || json?.message || `ML service error (${res.status})`);
    err.statusCode = res.status === 422 ? 400 : 502;
    throw err;
  }
  return json;
}

function predictWaitTime(payload) {
  return postJson("/predict/wait-time", payload);
}

function predictCrowd(payload) {
  return postJson("/predict/crowd", payload);
}

module.exports = { predictWaitTime, predictCrowd };
