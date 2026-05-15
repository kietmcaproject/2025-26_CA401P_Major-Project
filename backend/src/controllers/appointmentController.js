const Appointment = require("../models/Appointment");
const { bookAppointment, checkInAppointment, listAppointmentsForUser } = require("../services/appointmentService");

async function bookAppointmentController(req, res, next) {
  try {
    const { doctorId, slotStartAt, slotEndAt, reason, priorityLevel, priorityScore, patientId } =
      req.validated.body;
    const authUserId = req.auth.sub;
    const isPatient = req.auth.role === "PATIENT";

    const appt = await bookAppointment({
      patientId: isPatient ? authUserId : patientId || authUserId,
      doctorId,
      slotStartAt: new Date(slotStartAt),
      slotEndAt: new Date(slotEndAt),
      reason,
      priorityLevel,
      priorityScore,
      createdByUserId: authUserId,
    });

    return res.status(201).json({ ok: true, data: appt });
  } catch (e) {
    return next(e);
  }
}

async function checkInController(req, res, next) {
  try {
    const { appointmentId } = req.validated.body;
    if (req.auth.role === "PATIENT") {
      const appt = await Appointment.findById(appointmentId).select("patientId");
      if (!appt || String(appt.patientId) !== String(req.auth.sub)) {
        return res.status(403).json({ ok: false, error: { message: "You can only check-in your own appointment" } });
      }
    }
    const result = await checkInAppointment({ appointmentId, actorUserId: req.auth.sub });
    return res.json({ ok: true, data: result });
  } catch (e) {
    return next(e);
  }
}

async function myAppointmentsController(req, res, next) {
  try {
    const result = await listAppointmentsForUser({ userId: req.auth.sub, role: req.auth.role });
    return res.json({ ok: true, data: result });
  } catch (e) {
    return next(e);
  }
}

module.exports = { bookAppointmentController, checkInController, myAppointmentsController };
