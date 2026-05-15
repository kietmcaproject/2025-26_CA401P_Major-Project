const { listActiveDoctors } = require("../services/doctorsService");

async function listDoctorsController(req, res, next) {
  try {
    const doctors = await listActiveDoctors();
    return res.json({ ok: true, data: doctors });
  } catch (e) {
    return next(e);
  }
}

module.exports = { listDoctorsController };
