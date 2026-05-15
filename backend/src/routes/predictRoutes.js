const express = require("express");
const { z } = require("zod");
const { validate } = require("../middleware/validate");
const { waitTimeController, crowdController } = require("../controllers/predictController");

const router = express.Router();

router.post(
  "/wait-time",
  validate(
    z.object({
      body: z.object({
        department: z.string().min(2).max(120),
        timestamp: z.string(),
        queue_len: z.number().int().min(0).max(500),
        arrivals_30m: z.number().min(0).max(200),
        service_rate: z.number().min(1).max(200),
        emergency_share: z.number().min(0).max(1),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  waitTimeController
);

router.post(
  "/crowd",
  validate(
    z.object({
      body: z.object({
        department: z.string().min(2).max(120).optional(),
        timestamp: z.string(),
      }),
      params: z.object({}).optional(),
      query: z.object({}).optional(),
    })
  ),
  crowdController
);

module.exports = router;
