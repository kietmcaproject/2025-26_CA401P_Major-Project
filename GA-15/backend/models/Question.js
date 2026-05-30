const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  interviewId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', required: true },
  questionText: { type: String, required: true },
  questionType: { type: String, default: 'Technical' },
  userAnswer:   { type: String, default: '' },
  aiFeedback:   { type: String, default: '' },
  score:        { type: Number, default: 0 },

  // Multi-dimensional scoring
  technicalScore:     { type: Number, default: 0 },
  clarityScore:       { type: Number, default: 0 },
  problemSolvingScore:{ type: Number, default: 0 },

  // Sentiment analysis
  sentiment: {
    confidence:  { type: Number, default: 0 },   // 0-100
    clarity:     { type: Number, default: 0 },
    hesitation:  { type: Number, default: 0 },
    label:       { type: String, default: 'Neutral' } // Confident / Hesitant / Neutral
  },

  // Follow-up tracking
  isFollowUp:       { type: Boolean, default: false },
  parentQuestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', default: null },

  // Code challenge
  isCodeChallenge:  { type: Boolean, default: false },
  codeLanguage:     { type: String, default: 'javascript' },
  userCode:         { type: String, default: '' },
  codeTestsPassed:  { type: Number, default: 0 },
  codeTestsTotal:   { type: Number, default: 0 },

  order: { type: Number, default: 0 }
});

module.exports = mongoose.model('Question', QuestionSchema);
