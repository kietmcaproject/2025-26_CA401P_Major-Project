const mongoose = require("mongoose");

const slotTemplateSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0=Sun..6=Sat
    startTime: { type: String, required: true }, // "HH:mm"
    endTime: { type: String, required: true }, // "HH:mm"
    slotMinutes: { type: Number, required: true, min: 5, max: 180 },
    capacityPerSlot: { type: Number, default: 1, min: 1, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

    name: { type: String, required: true, trim: true, maxlength: 120 },
    department: { type: String, required: true, trim: true, maxlength: 120, index: true },
    specialization: { type: String, trim: true, maxlength: 200 },

    registrationNo: { type: String, trim: true, maxlength: 64, index: true },

    // Slot-based queue configuration
    slotTemplates: { type: [slotTemplateSchema], default: [] },

    // Base service time used by predictions (minutes per patient)
    avgServiceMinutes: { type: Number, default: 8, min: 1, max: 180 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

doctorSchema.index({ department: 1, isActive: 1 });
doctorSchema.index({ name: "text", department: "text", specialization: "text" });

module.exports = mongoose.model("Doctor", doctorSchema);
