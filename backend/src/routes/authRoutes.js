const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { signupController, loginController, meController } = require("../controllers/authController");
const { USER_ROLES } = require("../lib/constants");

const router = express.Router();

router.post(
  "/signup",
  validate(
    z.object({
      body: z.object({
        name: z.string().min(2).max(120),
        email: z.string().email().max(190),
        phone: z.string().min(8).max(20).optional(),
        password: z.string().min(6).max(200),
        role: z.enum(Object.values(USER_ROLES)).optional(),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  signupController
);

router.post(
  "/login",
  validate(
    z.object({
      body: z.object({
        email: z.string().email().max(190),
        password: z.string().min(6).max(200),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  loginController
);

router.get("/me", requireAuth, meController);

module.exports = router;
