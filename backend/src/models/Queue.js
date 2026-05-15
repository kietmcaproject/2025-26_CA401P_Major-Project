const mongoose = require("mongoose");
const { QUEUE_STATUS, QUEUE_ENTRY_STATUS, PRIORITY_LEVEL } = require("../lib/constants");

const queueEntrySchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Slot-based queue entry: each queue is for a doctor+slot window
    slotStartAt: { type: Date, required: true, index: true },
    slotEndAt: { type: Date, required: true },

    // Priority queue ordering (within slot)
    priorityLevel: {
      type: String,
      enum: Object.values(PRIORITY_LEVEL),
      default: PRIORITY_LEVEL.NORMAL,
      index: true,
    },
    priorityScore: { type: Number, default: 0, index: true },

    // Status tracking
    status: {
      type: String,
      enum: Object.values(QUEUE_ENTRY_STATUS),
      default: QUEUE_ENTRY_STATUS.WAITING,
      index: true,
    },

    tokenNo: { type: Number, required: true },
    position: { type: Number, required: true, index: true }, // derived ordering at insert time

    estimatedWaitMinutes: { type: Number, default: null },

    calledAt: { type: Date },
    serviceStartedAt: { type: Date },
    serviceEndedAt: { type: Date },

    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

const queueSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, index: true },

    // Slot-based queue: one queue per doctor per slot window
    slotStartAt: { type: Date, required: true, index: true },
    slotEndAt: { type: Date, required: true },

    status: { type: String, enum: Object.values(QUEUE_STATUS), default: QUEUE_STATUS.OPEN, index: true },

    currentTokenNo: { type: Number, default: 0 },
    nextTokenNo: { type: Number, default: 1 },

    // Real-time view helpers
    lastCalledEntryId: { type: mongoose.Schema.Types.ObjectId },
    lastUpdatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Embedded entries for fast reads (audit is in QueueLogs)
    entries: { type: [queueEntrySchema], default: [] },
  },
  { timestamps: true }
);

queueSchema.index({ doctorId: 1, slotStartAt: 1 }, { unique: true });
queueSchema.index({ doctorId: 1, slotStartAt: 1, status: 1 });

// For efficient "who is next" queries:
queueSchema.index({
  doctorId: 1,
  slotStartAt: 1,
  "entries.status": 1,
  "entries.priorityScore": -1,
  "entries.position": 1,
});

module.exports = mongoose.model("Queue", queueSchema);
