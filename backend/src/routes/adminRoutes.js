const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { approveDoctorController, approveUserController } = require("../controllers/adminController");
const { USER_ROLES } = require("../lib/constants");

const router = express.Router();

router.post(
  "/approve-doctor",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(
    z.object({
      body: z.object({
        doctorId: z.string().min(10),
        approve: z.boolean(),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  approveDoctorController
);

router.post(
  "/approve-user",
  requireAuth,
  requireRole(USER_ROLES.ADMIN),
  validate(
    z.object({
      body: z.object({
        userId: z.string().min(10),
        approve: z.boolean(),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  approveUserController
);

module.exports = router;
