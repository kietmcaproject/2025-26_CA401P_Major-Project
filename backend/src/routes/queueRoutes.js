const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getQueueController, nextController, noShowController, skipController } = require("../controllers/queueController");
const { USER_ROLES } = require("../lib/constants");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  validate(
    z.object({
      body: z.object({}).optional(),
      params: z.object({}).optional(),
      query: z.object({
        doctorId: z.string().min(10),
        slotStartAt: z.string(),
      }),
    })
  ),
  getQueueController
);

router.post(
  "/next",
  requireAuth,
  requireRole(USER_ROLES.DOCTOR, USER_ROLES.RECEPTIONIST, USER_ROLES.ADMIN),
  validate(
    z.object({
      body: z.object({
        doctorId: z.string().min(10),
        slotStartAt: z.string(),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  nextController
);

router.post(
  "/no-show",
  requireAuth,
  requireRole(USER_ROLES.DOCTOR, USER_ROLES.RECEPTIONIST, USER_ROLES.ADMIN),
  validate(
    z.object({
      body: z.object({
        doctorId: z.string().min(10),
        slotStartAt: z.string(),
        queueEntryId: z.string().min(10),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  noShowController
);

router.post(
  "/skip",
  requireAuth,
  requireRole(USER_ROLES.DOCTOR, USER_ROLES.RECEPTIONIST, USER_ROLES.ADMIN),
  validate(
    z.object({
      body: z.object({
        doctorId: z.string().min(10),
        slotStartAt: z.string(),
        queueEntryId: z.string().min(10),
        reason: z.string().max(500).optional(),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  skipController
);

module.exports = router;
