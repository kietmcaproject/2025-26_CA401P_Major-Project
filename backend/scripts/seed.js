/**
 * DEV seed: wipes User, Doctor, Appointment, Queue, QueueLog and inserts
 * 50 patients, 5 doctors (+ doctor users), 200 appointments with 9–11 AM IST peak density.
 *
 * Run: npm run seed
 * Requires: MongoDB + backend/.env (MONGO_URI)
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const { connectDb } = require("../src/config/db");
const { env } = require("../src/config/env");
const User = require("../src/models/User");
const Doctor = require("../src/models/Doctor");
const Appointment = require("../src/models/Appointment");
const Queue = require("../src/models/Queue");
const QueueLog = require("../src/models/QueueLog");
const { USER_ROLES, APPOINTMENT_STATUS, PRIORITY_LEVEL, QUEUE_ENTRY_STATUS, QUEUE_STATUS } = require("../src/lib/constants");
const { computePriorityScore } = require("../src/lib/priority");

const SEED_PASSWORD = "Password@123";
const SEED_DOMAIN = "hospital-seed.demo";

/** Deterministic PRNG for reproducible-ish data (same run = same sequence). */
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0x9e3779b9);

const FIRST_NAMES = [
  "Aarav",
  "Aditya",
  "Ananya",
  "Arjun",
  "Diya",
  "Ishaan",
  "Kavya",
  "Kiara",
  "Krishna",
  "Lakshmi",
  "Manish",
  "Meera",
  "Neha",
  "Nikhil",
  "Pooja",
  "Priya",
  "Rahul",
  "Rajesh",
  "Riya",
  "Rohan",
  "Saanvi",
  "Sanjay",
  "Shreya",
  "Suresh",
  "Tanvi",
  "Vikram",
  "Ayesha",
  "Fatima",
  "Imran",
  "Kabir",
  "Nisha",
  "Deepak",
  "Harish",
  "Jyoti",
  "Kiran",
  "Lalita",
  "Mukesh",
  "Pankaj",
  "Rekha",
  "Sunita",
  "Vijay",
  "Anil",
  "Geeta",
  "Harsh",
  "Irfan",
  "Jaya",
  "Kunal",
  "Naveen",
  "Omkar",
  "Pallavi",
];

const LAST_NAMES = [
  "Sharma",
  "Verma",
  "Patel",
  "Reddy",
  "Iyer",
  "Nair",
  "Menon",
  "Kapoor",
  "Singh",
  "Kumar",
  "Gupta",
  "Mehta",
  "Joshi",
  "Desai",
  "Kulkarni",
  "Chopra",
  "Malhotra",
  "Agarwal",
  "Banerjee",
  "Mukherjee",
];

const REASONS = [
  "Fever and body ache — viral symptoms",
  "Follow-up for diabetes / BP",
  "Persistent cough for 1 week",
  "Chest tightness on exertion",
  "Skin rash and itching",
  "Child vaccination due",
  "Knee pain after fall",
  "Annual health check-up",
  "Breathlessness at night",
  "Migraine — frequent episodes",
  "Stomach pain and acidity",
  "Thyroid review",
  "Post-operative stitch check",
  "Dizziness and weakness",
];

const DOCTOR_SPECS = [
  {
    name: "Dr. Rohan Mehta",
    department: "General Medicine",
    specialization: "Internal Medicine & Infectious Diseases",
    registrationNo: "MCI-GM-2014-8821",
    avgServiceMinutes: 9,
  },
  {
    name: "Dr. Ananya Iyer",
    department: "Cardiology",
    specialization: "Non-invasive Cardiology",
    registrationNo: "MCI-CV-2012-4410",
    avgServiceMinutes: 12,
  },
  {
    name: "Dr. Arjun Singh",
    department: "Pulmonology",
    specialization: "Respiratory & Allergy",
    registrationNo: "MCI-PL-2015-1192",
    avgServiceMinutes: 11,
  },
  {
    name: "Dr. Pooja Nair",
    department: "Dermatology",
    specialization: "Clinical Dermatology",
    registrationNo: "MCI-DM-2016-3304",
    avgServiceMinutes: 10,
  },
  {
    name: "Dr. Kavya Reddy",
    department: "Pediatrics",
    specialization: "Child & Adolescent Health",
    registrationNo: "MCI-PD-2013-7755",
    avgServiceMinutes: 10,
  },
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * Pick local IST wall-clock time for OPD; ~45% in 09:00–10:59 (peak), rest spread.
 */
function randomISTSlotOnDay(dayStr) {
  const r = rand();
  let hour;
  let minute = Math.floor(rand() * 60);

  if (r < 0.45) {
    hour = 9 + Math.floor(rand() * 2);
  } else if (r < 0.58) {
    hour = 8;
    minute = Math.floor(rand() * 60);
  } else if (r < 0.78) {
    hour = 11 + Math.floor(rand() * 2);
  } else if (r < 0.92) {
    hour = 14 + Math.floor(rand() * 2);
  } else {
    hour = 16 + Math.floor(rand() * 2);
    if (hour > 17) hour = 17;
  }

  minute = Math.floor(rand() * 4) * 15;
  return new Date(`${dayStr}T${pad2(hour)}:${pad2(minute)}:00+05:30`);
}

function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60 * 1000);
}

function randomPriority() {
  const r = rand();
  if (r < 0.04) return PRIORITY_LEVEL.EMERGENCY;
  if (r < 0.12) return PRIORITY_LEVEL.SENIOR;
  if (r < 0.15) return PRIORITY_LEVEL.PREGNANT;
  if (r < 0.17) return PRIORITY_LEVEL.VIP;
  return PRIORITY_LEVEL.NORMAL;
}

function randomStatus() {
  const r = rand();
  if (r < 0.62) return APPOINTMENT_STATUS.BOOKED;
  if (r < 0.82) return APPOINTMENT_STATUS.COMPLETED;
  if (r < 0.9) return APPOINTMENT_STATUS.CANCELLED;
  if (r < 0.94) return APPOINTMENT_STATUS.IN_QUEUE;
  if (r < 0.97) return APPOINTMENT_STATUS.CHECKED_IN;
  return APPOINTMENT_STATUS.NO_SHOW;
}

async function wipe() {
  await Promise.all([
    QueueLog.deleteMany({}),
    Queue.deleteMany({}),
    Appointment.deleteMany({}),
    Doctor.deleteMany({}),
    User.deleteMany({}),
  ]);
}

async function main() {
  await connectDb(env.mongoUri);
  console.log("Connected. Wiping collections…");
  await wipe();

  const passwordHash = await User.hashPassword(SEED_PASSWORD);

  const patients = [];
  for (let i = 0; i < 50; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const name = `${fn} ${ln}`;
    const n = i + 1;
    const email = `patient${n}@${SEED_DOMAIN}`;
    const phone = `98${String(10000000 + n).slice(-8)}`;
    patients.push(
      await User.create({
        name,
        email,
        phone,
        role: USER_ROLES.PATIENT,
        passwordHash,
        isActive: true,
      })
    );
  }
  console.log(`Created ${patients.length} patients (password: ${SEED_PASSWORD})`);

  const doctors = [];
  for (let i = 0; i < DOCTOR_SPECS.length; i++) {
    const spec = DOCTOR_SPECS[i];
    const n = i + 1;
    const docUser = await User.create({
      name: spec.name,
      email: `doctor${n}@${SEED_DOMAIN}`,
      phone: `97${String(10000000 + n).slice(-8)}`,
      role: USER_ROLES.DOCTOR,
      passwordHash,
      isActive: true,
    });

    const slotTemplates = [1, 2, 3, 4, 5].map((dow) => ({
      dayOfWeek: dow,
      startTime: "09:00",
      endTime: "13:00",
      slotMinutes: 30,
      capacityPerSlot: 4,
      isActive: true,
    }));

    const doctor = await Doctor.create({
      userId: docUser._id,
      name: spec.name,
      department: spec.department,
      specialization: spec.specialization,
      registrationNo: spec.registrationNo,
      avgServiceMinutes: spec.avgServiceMinutes,
      isActive: true,
      slotTemplates,
    });
    doctors.push(doctor);
  }
  console.log(`Created ${doctors.length} doctors + doctor user accounts`);

  const admin = await User.create({
    name: "Admin User",
    email: `admin@${SEED_DOMAIN}`,
    phone: "9612345001",
    role: USER_ROLES.ADMIN,
    passwordHash,
    isActive: true,
  });

  const receptionist = await User.create({
    name: "Reception Desk",
    email: `reception@${SEED_DOMAIN}`,
    phone: "9512345002",
    role: USER_ROLES.RECEPTIONIST,
    passwordHash,
    isActive: true,
  });
  console.log(`Created admin (${admin.email}) + receptionist (${receptionist.email})`);

  const dayStrings = [];
  for (let d = 1; d <= 28; d++) {
    dayStrings.push(`2026-04-${pad2(d)}`);
  }

  const appointments = [];
  const usedKeys = new Set();

  for (let i = 0; i < 200; i++) {
    const patient = patients[Math.floor(rand() * patients.length)];
    const doctor = doctors[Math.floor(rand() * doctors.length)];
    const dayStr = dayStrings[Math.floor(rand() * dayStrings.length)];

    let slotStartAt = randomISTSlotOnDay(dayStr);
    let guard = 0;
    while (guard < 80) {
      const key = `${patient._id}:${doctor._id}:${slotStartAt.getTime()}`;
      if (!usedKeys.has(key)) {
        usedKeys.add(key);
        break;
      }
      slotStartAt = addMinutes(slotStartAt, 15);
      guard++;
    }

    const slotEndAt = addMinutes(slotStartAt, 30);
    const priorityLevel = randomPriority();
    const priorityScore = computePriorityScore({ priorityLevel });
    const status = randomStatus();
    const reason = REASONS[Math.floor(rand() * REASONS.length)];

    const doc = {
      patientId: patient._id,
      doctorId: doctor._id,
      slotStartAt,
      slotEndAt,
      reason,
      priorityLevel,
      priorityScore,
      status,
      createdByUserId: receptionist._id,
    };

    if (status === APPOINTMENT_STATUS.COMPLETED) {
      doc.completedAt = addMinutes(slotEndAt, 10 + Math.floor(rand() * 40));
    }
    if (status === APPOINTMENT_STATUS.CANCELLED) {
      doc.cancelledAt = addMinutes(slotStartAt, -60 * 24);
    }
    if (status === APPOINTMENT_STATUS.CHECKED_IN || status === APPOINTMENT_STATUS.IN_QUEUE) {
      doc.checkedInAt = addMinutes(slotStartAt, -15);
    }

    appointments.push(doc);
  }

  const insertedAppointments = await Appointment.insertMany(appointments);
  console.log(`Created ${insertedAppointments.length} appointments (peak density 09:00–10:59 IST)`);

  // Seed Queue docs so the UI can show a realistic queue immediately.
  // We generate one queue per doctor+slotStartAt, then create embedded entries (tokens) from appointments.
  const appts = insertedAppointments.map((a) => (a.toObject ? a.toObject() : a));

  const groups = new Map(); // key -> appointment[]
  for (const a of appts) {
    const key = `${String(a.doctorId)}:${new Date(a.slotStartAt).toISOString()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(a);
  }

  const queueDocs = [];
  for (const [, list] of groups.entries()) {
    const sortedByArrival = [...list];
    sortedByArrival.sort((a, b) => {
      const ta = a.checkedInAt ? new Date(a.checkedInAt).getTime() : new Date(a.slotStartAt).getTime();
      const tb = b.checkedInAt ? new Date(b.checkedInAt).getTime() : new Date(b.slotStartAt).getTime();
      return ta - tb;
    });

    const eligible = sortedByArrival.filter((a) =>
      [APPOINTMENT_STATUS.IN_QUEUE, APPOINTMENT_STATUS.CHECKED_IN, APPOINTMENT_STATUS.NO_SHOW, APPOINTMENT_STATUS.CALLED].includes(a.status)
    );

    if (!eligible.length) continue;

    const first = eligible[0];
    const doctorId = first.doctorId;
    const slotStartAt = new Date(first.slotStartAt);
    const slotEndAt = new Date(first.slotEndAt);

    // How many tokens should be already CALLED in the seeded snapshot?
    // (small number, but enough to drive token UI + activity feed)
    const callCount = Math.min(
      2,
      eligible.filter((a) => a.status !== APPOINTMENT_STATUS.NO_SHOW).length >= 4 ? 1 : 0
    );

    const entries = [];
    let tokenNo = 1;
    let currentTokenNo = 0;

    for (let i = 0; i < eligible.length; i++) {
      const a = eligible[i];
      const position = i + 1;

      if (a.status === APPOINTMENT_STATUS.NO_SHOW) {
        entries.push({
          appointmentId: a._id,
          patientId: a.patientId,
          slotStartAt,
          slotEndAt,
          priorityLevel: a.priorityLevel,
          priorityScore: a.priorityScore,
          status: QUEUE_ENTRY_STATUS.NO_SHOW,
          tokenNo,
          position,
          estimatedWaitMinutes: null,
        });
        tokenNo++;
        continue;
      }

      if (i < callCount) {
        entries.push({
          appointmentId: a._id,
          patientId: a.patientId,
          slotStartAt,
          slotEndAt,
          priorityLevel: a.priorityLevel,
          priorityScore: a.priorityScore,
          status: QUEUE_ENTRY_STATUS.CALLED,
          tokenNo,
          position,
          estimatedWaitMinutes: null,
          calledAt: new Date(slotStartAt.getTime() + i * 6 * 60 * 1000),
        });
        currentTokenNo = tokenNo;
        tokenNo++;
        continue;
      }

      entries.push({
        appointmentId: a._id,
        patientId: a.patientId,
        slotStartAt,
        slotEndAt,
        priorityLevel: a.priorityLevel,
        priorityScore: a.priorityScore,
        status: QUEUE_ENTRY_STATUS.WAITING,
        tokenNo,
        position,
        estimatedWaitMinutes: null,
      });
      tokenNo++;
    }

    queueDocs.push({
      doctorId,
      slotStartAt,
      slotEndAt,
      status: QUEUE_STATUS.OPEN,
      currentTokenNo,
      nextTokenNo: tokenNo,
      lastCalledEntryId: entries.find((e) => e.status === QUEUE_ENTRY_STATUS.CALLED)?._id || undefined,
      lastUpdatedByUserId: null,
      entries,
    });
  }

  if (queueDocs.length) {
    const createdQueues = await Queue.insertMany(queueDocs);

    // Link appointments -> queueId & queueEntryId and normalize snapshot statuses.
    const bulkOps = [];
    for (const q of createdQueues) {
      for (const entry of q.entries) {
        let newStatus = APPOINTMENT_STATUS.IN_QUEUE;
        if (entry.status === QUEUE_ENTRY_STATUS.CALLED) newStatus = APPOINTMENT_STATUS.CALLED;
        if (entry.status === QUEUE_ENTRY_STATUS.NO_SHOW) newStatus = APPOINTMENT_STATUS.NO_SHOW;

        bulkOps.push({
          updateOne: {
            filter: { _id: entry.appointmentId },
            update: {
              $set: {
                queueId: q._id,
                queueEntryId: entry._id,
                status: newStatus,
              },
            },
          },
        });
      }
    }
    if (bulkOps.length) await Appointment.bulkWrite(bulkOps);
  }

  const peakCount = appointments.filter((a) => {
    const parts = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).formatToParts(a.slotStartAt);
    const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    return h === 9 || h === 10;
  }).length;
  console.log(`Peak-window share (9–10 IST hours): ${((peakCount / appointments.length) * 100).toFixed(1)}%`);

  console.log("\nDone. Login examples:");
  console.log(`  Patient: patient1@${SEED_DOMAIN} / ${SEED_PASSWORD}`);
  console.log(`  Doctor:  doctor1@${SEED_DOMAIN} / ${SEED_PASSWORD}`);
  console.log(`  Admin:   admin@${SEED_DOMAIN} / ${SEED_PASSWORD}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
