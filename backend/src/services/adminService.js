const User = require("../models/User");
const Doctor = require("../models/Doctor");
const { USER_ROLES } = require("../lib/constants");

async function approveDoctor({ doctorId, approve, actorUserId }) {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    const err = new Error("Doctor not found");
    err.statusCode = 404;
    throw err;
  }

  doctor.isActive = Boolean(approve);
  await doctor.save();

  if (doctor.userId) {
    const user = await User.findById(doctor.userId);
    if (user && user.role === USER_ROLES.DOCTOR) {
      user.isActive = Boolean(approve);
      await user.save();
    }
  }

  return { doctor };
}

async function approveUser({ userId, approve }) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  user.isActive = Boolean(approve);
  await user.save();
  return { user };
}

module.exports = { approveDoctor, approveUser };
