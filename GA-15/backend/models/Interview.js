const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  interviewDate:{ type: Date, default: Date.now },
  totalScore:   { type: Number, default: 0 },
  completed:    { type: Boolean, default: false },
  improvementRoadmap: { type: String, default: '' },

  // Role-based persona
  persona: { type: String, enum: ['Technical', 'HR', 'Managerial'], default: 'Technical' },

  // Weighted dimension scores
  technicalScore:     { type: Number, default: 0 },
  clarityScore:       { type: Number, default: 0 },
  problemSolvingScore:{ type: Number, default: 0 },

  // Coaching report
  coachingReport: { type: String, default: '' },
  strongPoints:   [{ type: String }],
  improvementAreas:[{ type: String }],
  suggestedResources:[{ type: String }],

  // Contextual memory: stores summary of answers for follow-up context
  contextualMemory: [{
    questionText: String,
    answerSummary: String,
    keyTopics: [String]
  }]
});

module.exports = mongoose.model('Interview', InterviewSchema);
