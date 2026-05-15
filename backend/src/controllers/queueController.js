const { getQueue, callNext, markNoShow, skipEntry } = require("../services/queueService");

async function getQueueController(req, res, next) {
  try {
    const { doctorId, slotStartAt } = req.validated.query;
    const queue = await getQueue({ doctorId, slotStartAt: new Date(slotStartAt) });
    return res.json({ ok: true, data: queue });
  } catch (e) {
    return next(e);
  }
}

async function nextController(req, res, next) {
  try {
    const { doctorId, slotStartAt } = req.validated.body;
    const result = await callNext({ doctorId, slotStartAt: new Date(slotStartAt), actorUserId: req.auth.sub });
    return res.json({ ok: true, data: result });
  } catch (e) {
    return next(e);
  }
}

async function noShowController(req, res, next) {
  try {
    const { doctorId, slotStartAt, queueEntryId } = req.validated.body;
    const result = await markNoShow({
      doctorId,
      slotStartAt: new Date(slotStartAt),
      queueEntryId,
      actorUserId: req.auth.sub,
    });
    return res.json({ ok: true, data: result });
  } catch (e) {
    return next(e);
  }
}

async function skipController(req, res, next) {
  try {
    const { doctorId, slotStartAt, queueEntryId, reason } = req.validated.body;
    const result = await skipEntry({
      doctorId,
      slotStartAt: new Date(slotStartAt),
      queueEntryId,
      actorUserId: req.auth.sub,
      reason,
    });
    return res.json({ ok: true, data: result });
  } catch (e) {
    return next(e);
  }
}

module.exports = { getQueueController, nextController, noShowController, skipController };
