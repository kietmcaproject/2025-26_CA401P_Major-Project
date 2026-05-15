const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const User = require("../models/User");
const { USER_ROLES } = require("../lib/constants");

function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, name: user.name, email: user.email },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

async function signup({ name, email, phone, password, role }) {
  const userRole = role || USER_ROLES.PATIENT;
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email,
    phone,
    role: userRole,
    passwordHash,
    isActive: userRole === USER_ROLES.PATIENT, // doctors/admins typically require approval
  });
  const token = signToken(user);
  return { user, token };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }
  if (!user.isActive) {
    const err = new Error("Account not approved/active");
    err.statusCode = 403;
    throw err;
  }
  const ok = await user.verifyPassword(password);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }
  user.lastLoginAt = new Date();
  await user.save();
  const token = signToken(user);
  return { user, token };
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return user;
}

module.exports = { signup, login, getMe };
