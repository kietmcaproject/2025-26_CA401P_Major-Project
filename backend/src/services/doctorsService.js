const Doctor = require("../models/Doctor");

const EMERGENCY_DEPTS = new Set(["Cardiology", "Pulmonology", "General Medicine"]);

function serviceRateFromDoctor(doc) {
  const mins = doc.avgServiceMinutes && doc.avgServiceMinutes > 0 ? doc.avgServiceMinutes : 10;
  return Math.min(200, Math.max(1, Math.round(60 / mins)));
}

async function listActiveDoctors() {
  const rows = await Doctor.find({ isActive: true })
    .select("name department specialization avgServiceMinutes registrationNo")
    .sort({ department: 1, name: 1 })
    .lean();

  return rows.map((d) => ({
    id: String(d._id),
    name: d.name,
    department: d.department,
    specialization: d.specialization || "",
    avgServiceMinutes: d.avgServiceMinutes ?? 10,
    serviceRate: serviceRateFromDoctor(d),
    rating: 4.5,
    isEmergencyCapable: EMERGENCY_DEPTS.has(d.department),
    nextSlotLabel: "Pick a slot when booking",
  }));
}

module.exports = { listActiveDoctors, serviceRateFromDoctor };
