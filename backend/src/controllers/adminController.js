const { approveDoctor, approveUser } = require("../services/adminService");

async function approveDoctorController(req, res, next) {
  try {
    const { doctorId, approve } = req.validated.body;
    const result = await approveDoctor({ doctorId, approve, actorUserId: req.auth.sub });
    return res.json({ ok: true, data: result });
  } catch (e) {
    return next(e);
  }
}

async function approveUserController(req, res, next) {
  try {
    const { userId, approve } = req.validated.body;
    const result = await approveUser({ userId, approve });
    return res.json({ ok: true, data: result });
  } catch (e) {
    return next(e);
  }
}

module.exports = { approveDoctorController, approveUserController };
