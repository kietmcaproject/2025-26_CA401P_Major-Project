const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeUrl: { type: String, required: false }, // Optional, maybe we just save the file local or base64 or just text
  extractedText: { type: String, required: true },
  detectedSkills: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', ResumeSchema);
