const SYMPTOM_TO_DEPT = [
  { key: "fever", dept: "General Medicine" },
  { key: "cough", dept: "Pulmonology" },
  { key: "breath", dept: "Pulmonology" },
  { key: "chest", dept: "Cardiology" },
  { key: "heart", dept: "Cardiology" },
  { key: "skin", dept: "Dermatology" },
  { key: "rash", dept: "Dermatology" },
  { key: "preg", dept: "Obstetrics" },
  { key: "baby", dept: "Pediatrics" },
  { key: "child", dept: "Pediatrics" },
  { key: "ortho", dept: "Orthopedics" },
  { key: "bone", dept: "Orthopedics" },
  { key: "tooth", dept: "Dentistry" },
  { key: "dental", dept: "Dentistry" },
  { key: "eye", dept: "Ophthalmology" },
  { key: "vision", dept: "Ophthalmology" },
];

export function inferDepartmentFromComplaint(complaint) {
  const text = String(complaint || "").toLowerCase();
  for (const rule of SYMPTOM_TO_DEPT) {
    if (text.includes(rule.key)) return rule.dept;
  }
  return null;
}

export function recommendDoctors({ doctors, complaint, preferredDept, mlWaitById = {} }) {
  const inferredDept = preferredDept || inferDepartmentFromComplaint(complaint);
  const scored = doctors.map((d) => {
    const mlWait = mlWaitById[d.id]?.wait_minutes;
    const waitMins = typeof mlWait === "number" ? mlWait : d.predictedWaitMins || 0;
    let score = 0;
    if (inferredDept && d.department === inferredDept) score += 100;
    if (d.isEmergencyCapable) score += 10;
    // Lower wait is better; normalize into a bonus
    score += Math.max(0, 60 - waitMins);
    // Slightly favor higher rating
    score += Math.round((d.rating || 0) * 5);
    return { doctor: d, score, inferredDept };
  });

  scored.sort((a, b) => b.score - a.score);
  return {
    inferredDept,
    recommendedDoctorId: scored[0]?.doctor?.id || null,
    ranked: scored.map((s) => s.doctor),
  };
}

