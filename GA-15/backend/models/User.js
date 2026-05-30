const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  credits: { type: Number, default: 3 },
  role: { type: String, default: 'Software Engineer' },
  skills: { type: [String], default: [] },
  experience: { type: String, default: 'Fresher' },
  bio: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
