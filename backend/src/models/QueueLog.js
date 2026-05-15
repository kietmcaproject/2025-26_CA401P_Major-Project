const mongoose = require("mongoose");

const queueLogSchema = new mongoose.Schema(
  {
    queueId: { type: mongoose.Schema.Types.ObjectId, ref: "Queue", required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },

    // Optional linkage
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", index: true },
    queueEntryId: { type: mongoose.Schema.Types.ObjectId, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    // Status tracking/audit
    eventType: { type: String, required: true, trim: true, maxlength: 80, index: true },
    fromStatus: { type: String, trim: true, maxlength: 40 },
    toStatus: { type: String, trim: true, maxlength: 40 },

    message: { type: String, trim: true, maxlength: 500 },
    meta: { type: Object, default: {} },

    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

queueLogSchema.index({ queueId: 1, createdAt: -1 });
queueLogSchema.index({ doctorId: 1, createdAt: -1 });
queueLogSchema.index({ eventType: 1, createdAt: -1 });

module.exports = mongoose.model("QueueLog", queueLogSchema);
