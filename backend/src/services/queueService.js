const Queue = require("../models/Queue");
const QueueLog = require("../models/QueueLog");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { QUEUE_ENTRY_STATUS, APPOINTMENT_STATUS } = require("../lib/constants");
const { emitQueueUpdated, emitActivityEvent } = require("../socket");

async function formatQueue(queue) {
  const qObj = queue.toObject ? queue.toObject() : queue;
  const patientIds = (qObj.entries || [])
    .map((e) => e.patientId)
    .filter(Boolean)
    .map((id) => String(id));

  const uniqueIds = [...new Set(patientIds)];
  const users = uniqueIds.length
    ? await User.find({ _id: { $in: uniqueIds } }).select("name").lean()
    : [];
  const nameById = {};
  users.forEach((u) => {
    nameById[String(u._id)] = u.name;
  });

  qObj.entries = (qObj.entries || []).map((e) => {
    const pid = e.patientId ? String(e.patientId) : null;
    return {
      ...e,
      patientName: pid ? nameById[pid] || "Patient" : "Patient",
    };
  });

  return qObj;
}

function pickNextEntry(entries) {
  // Only WAITING entries are eligible for "next". Others are effectively skipped.
  const candidates = entries.filter((e) => e.status === QUEUE_ENTRY_STATUS.WAITING);
  candidates.sort((a, b) => {
    if ((b.priorityScore || 0) !== (a.priorityScore || 0)) return (b.priorityScore || 0) - (a.priorityScore || 0);
    return (a.position || 0) - (b.position || 0);
  });
  return candidates[0] || null;
}

async function getQueue({ doctorId, slotStartAt }) {
  const queue = await Queue.findOne({ doctorId, slotStartAt });
  if (!queue) {
    const err = new Error("Queue not found");
    err.statusCode = 404;
    throw err;
  }
  return formatQueue(queue);
}

async function callNext({ doctorId, slotStartAt, actorUserId }) {
  const queue = await Queue.findOne({ doctorId, slotStartAt });
  if (!queue) {
    const err = new Error("Queue not found");
    err.statusCode = 404;
    throw err;
  }

  const nextEntry = pickNextEntry(queue.entries);
  if (!nextEntry) return { queue, entry: null };

  nextEntry.status = QUEUE_ENTRY_STATUS.CALLED;
  nextEntry.calledAt = new Date();
  queue.currentTokenNo = nextEntry.tokenNo;
  queue.lastCalledEntryId = nextEntry._id;
  queue.lastUpdatedByUserId = actorUserId;
  await queue.save();

  const appt = await Appointment.findById(nextEntry.appointmentId);
  if (appt) {
    appt.status = APPOINTMENT_STATUS.CALLED;
    await appt.save();
  }

  await QueueLog.create({
    queueId: queue._id,
    doctorId: queue.doctorId,
    appointmentId: nextEntry.appointmentId,
    queueEntryId: nextEntry._id,
    patientId: nextEntry.patientId,
    eventType: "CALL_NEXT",
    fromStatus: QUEUE_ENTRY_STATUS.WAITING,
    toStatus: QUEUE_ENTRY_STATUS.CALLED,
    actorUserId,
    meta: { tokenNo: nextEntry.tokenNo },
  });

  const formattedQueue = await formatQueue(queue);
  emitQueueUpdated({ doctorId: formattedQueue.doctorId, slotStartAt: formattedQueue.slotStartAt, queue: formattedQueue });

  const entryForPayload = formattedQueue.entries.find((e) => String(e._id) === String(nextEntry._id));
  emitActivityEvent({
    type: "TOKEN_CALLED",
    payload: {
      doctorId: String(formattedQueue.doctorId),
      slotStartAt: String(formattedQueue.slotStartAt),
      tokenNo: nextEntry.tokenNo,
      appointmentId: String(nextEntry.appointmentId),
      queueEntryId: String(nextEntry._id),
      patientName: entryForPayload?.patientName || "Patient",
    },
  });

  return { queue: formattedQueue, entry: entryForPayload || nextEntry };
}

async function markNoShow({ doctorId, slotStartAt, queueEntryId, actorUserId }) {
  const queue = await Queue.findOne({ doctorId, slotStartAt });
  if (!queue) {
    const err = new Error("Queue not found");
    err.statusCode = 404;
    throw err;
  }
  const entry = queue.entries.id(queueEntryId);
  if (!entry) {
    const err = new Error("Queue entry not found");
    err.statusCode = 404;
    throw err;
  }

  const fromStatus = entry.status;
  entry.status = QUEUE_ENTRY_STATUS.NO_SHOW;
  queue.lastUpdatedByUserId = actorUserId;
  await queue.save();

  const appt = await Appointment.findById(entry.appointmentId);
  if (appt) {
    appt.status = APPOINTMENT_STATUS.NO_SHOW;
    await appt.save();
  }

  await QueueLog.create({
    queueId: queue._id,
    doctorId: queue.doctorId,
    appointmentId: entry.appointmentId,
    queueEntryId: entry._id,
    patientId: entry.patientId,
    eventType: "MARK_NO_SHOW",
    fromStatus,
    toStatus: QUEUE_ENTRY_STATUS.NO_SHOW,
    actorUserId,
    meta: { tokenNo: entry.tokenNo },
  });

  const formattedQueue = await formatQueue(queue);
  emitQueueUpdated({
    doctorId: formattedQueue.doctorId,
    slotStartAt: formattedQueue.slotStartAt,
    queue: formattedQueue,
  });
  return { queue: formattedQueue, entry };
}

async function skipEntry({ doctorId, slotStartAt, queueEntryId, actorUserId, reason }) {
  const queue = await Queue.findOne({ doctorId, slotStartAt });
  if (!queue) {
    const err = new Error("Queue not found");
    err.statusCode = 404;
    throw err;
  }
  const entry = queue.entries.id(queueEntryId);
  if (!entry) {
    const err = new Error("Queue entry not found");
    err.statusCode = 404;
    throw err;
  }

  const fromStatus = entry.status;
  entry.status = QUEUE_ENTRY_STATUS.SKIPPED;
  queue.lastUpdatedByUserId = actorUserId;
  await queue.save();

  await QueueLog.create({
    queueId: queue._id,
    doctorId: queue.doctorId,
    appointmentId: entry.appointmentId,
    queueEntryId: entry._id,
    patientId: entry.patientId,
    eventType: "SKIP_ENTRY",
    fromStatus,
    toStatus: QUEUE_ENTRY_STATUS.SKIPPED,
    actorUserId,
    message: reason,
    meta: { tokenNo: entry.tokenNo },
  });

  const formattedQueue = await formatQueue(queue);
  emitQueueUpdated({
    doctorId: formattedQueue.doctorId,
    slotStartAt: formattedQueue.slotStartAt,
    queue: formattedQueue,
  });

  const entryForPayload = formattedQueue.entries.find((e) => String(e._id) === String(entry._id));
  emitActivityEvent({
    type: "QUEUE_SKIPPED",
    payload: {
      doctorId: String(formattedQueue.doctorId),
      slotStartAt: String(formattedQueue.slotStartAt),
      tokenNo: entry.tokenNo,
      queueEntryId: String(entry._id),
      appointmentId: String(entry.appointmentId),
      patientName: entryForPayload?.patientName || "Patient",
      reason: reason || null,
    },
  });

  return { queue: formattedQueue, entry: entryForPayload || entry };
}

module.exports = { getQueue, callNext, markNoShow, skipEntry, formatQueue };
