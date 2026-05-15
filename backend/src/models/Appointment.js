const mongoose = require("mongoose");
const { APPOINTMENT_STATUS, PRIORITY_LEVEL } = require("../lib/constants");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },

    reason: { type: String, trim: true, maxlength: 500 },

    // Slot-based appointment time window
    slotStartAt: { type: Date, required: true, index: true },
    slotEndAt: { type: Date, required: true },

    // Priority queue inputs
    priorityLevel: {
      type: String,
      enum: Object.values(PRIORITY_LEVEL),
      default: PRIORITY_LEVEL.NORMAL,
      index: true,
    },
    priorityScore: { type: Number, default: 0, index: true }, // higher => earlier within same slot

    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.BOOKED,
      index: true,
    },

    checkedInAt: { type: Date },
    cancelledAt: { type: Date },
    completedAt: { type: Date },

    // Linkage to queue entry once created
    queueId: { type: mongoose.Schema.Types.ObjectId, ref: "Queue", index: true },
    queueEntryId: { type: mongoose.Schema.Types.ObjectId, index: true },

    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, slotStartAt: 1, status: 1 });
appointmentSchema.index({ patientId: 1, slotStartAt: -1 });
appointmentSchema.index({ doctorId: 1, slotStartAt: 1, priorityScore: -1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
