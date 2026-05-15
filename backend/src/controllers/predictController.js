const { predictWaitTime, predictCrowd } = require("../services/mlClientService");

const ML_DEPARTMENTS = new Set([
  "General Medicine",
  "Cardiology",
  "Pulmonology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
]);

function normalizeDepartment(dept) {
  if (dept && ML_DEPARTMENTS.has(dept)) return dept;
  return "General Medicine";
}

async function waitTimeController(req, res, next) {
  try {
    const body = req.validated.body;
    const payload = {
      department: normalizeDepartment(body.department),
      timestamp: body.timestamp,
      queue_len: body.queue_len,
      arrivals_30m: body.arrivals_30m,
      service_rate: body.service_rate,
      emergency_share: body.emergency_share,
    };
    const data = await predictWaitTime(payload);
    return res.json({ ok: true, data });
  } catch (e) {
    return next(e);
  }
}

async function crowdController(req, res, next) {
  try {
    const body = req.validated.body;
    const data = await predictCrowd({
      department: body.department ? normalizeDepartment(body.department) : null,
      timestamp: body.timestamp,
    });
    return res.json({ ok: true, data });
  } catch (e) {
    return next(e);
  }
}

module.exports = { waitTimeController, crowdController };
