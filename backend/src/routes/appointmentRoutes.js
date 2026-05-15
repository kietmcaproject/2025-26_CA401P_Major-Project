const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { bookAppointmentController, checkInController, myAppointmentsController } = require("../controllers/appointmentController");
const { USER_ROLES, PRIORITY_LEVEL } = require("../lib/constants");

const router = express.Router();

router.post(
  "/book",
  requireAuth,
  validate(
    z.object({
      body: z.object({
        doctorId: z.string().min(10),
        slotStartAt: z.string(),
        slotEndAt: z.string(),
        reason: z.string().max(500).optional(),
        priorityLevel: z.enum(Object.values(PRIORITY_LEVEL)).optional(),
        priorityScore: z.number().optional(),
        // receptionists/admins can book on behalf of a patient
        patientId: z.string().min(10).optional(),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  bookAppointmentController
);

router.post(
  "/check-in",
  requireAuth,
  requireRole(USER_ROLES.RECEPTIONIST, USER_ROLES.ADMIN, USER_ROLES.PATIENT),
  validate(
    z.object({
      body: z.object({
        appointmentId: z.string().min(10),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  checkInController
);

router.get("/mine", requireAuth, myAppointmentsController);

module.exports = router;
