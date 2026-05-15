const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: { message: "Missing token" } });

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: { message: "Invalid token" } });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth?.role) return res.status(401).json({ ok: false, error: { message: "Unauthorized" } });
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ ok: false, error: { message: "Forbidden" } });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
