const Interview = require('../models/Interview');
const Question = require('../models/Question');
const Resume = require('../models/Resume');
const User = require('../models/User');
const {
  generateQuestions, evaluateAnswer, generateRoadmap,
  getQuestionHint, generateFollowUp, analyzeSentiment, generateCoachingReport
} = require('../utils/gemini');

// ── Start Interview ────────────────────────────────────────────────────────
exports.startInterview = async (req, res) => {
  try {
    const { resumeId, persona = 'Technical' } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.credits <= 0) {
      return res.status(403).json({ message: 'Insufficient credits.', code: 'NO_CREDITS' });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const interview = new Interview({ userId: req.user.userId, resumeId, persona });
    await interview.save();

    const questionsList = await generateQuestions(resume.detectedSkills, persona);
    if (!questionsList || questionsList.length === 0) {
      console.error('❌ generateQuestions returned empty. Skills:', resume.detectedSkills, 'Persona:', persona);
      return res.status(400).json({ message: 'AI failed to generate questions. Please try again in a moment.' });
    }

    const questions = questionsList.map((q, idx) => ({
      interviewId: interview._id,
      questionText: q.questionText || q,
      questionType: q.questionType || 'Technical',
      isCodeChallenge: q.isCodeChallenge || false,
      codeLanguage: q.codeLanguage || 'javascript',
      order: idx
    }));

    await Question.insertMany(questions);
    user.credits -= 1;
    await user.save();

    res.status(201).json({ interviewId: interview._id, creditsRemaining: user.credits, persona });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating interview' });
  }
};

// ── Get Questions ─────────────────────────────────────────────────────────
exports.getQuestions = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    if (interview.userId.toString() !== req.user.userId) return res.status(403).json({ message: 'Unauthorized access' });

    const questions = await Question.find({ interviewId: req.params.interviewId }).sort({ order: 1 });
    res.json(questions);
  } catch (err) {
    console.error('getQuestions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Submit Answer (with sentiment + multi-dim scoring + contextual memory) ─
exports.submitAnswer = async (req, res) => {
  try {
    const { questionId, answer, userCode } = req.body;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const interview = await Interview.findById(question.interviewId);
    if (!interview || interview.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Run sentiment analysis (fast, no Gemini call)
    const sentiment = await analyzeSentiment(answer);

    // Run multi-dimensional AI evaluation
    const evaluation = await evaluateAnswer(question.questionText, answer, question.questionType);

    question.userAnswer   = answer;
    question.userCode     = userCode || '';
    question.aiFeedback   = evaluation.feedback;
    question.score        = evaluation.score;
    question.technicalScore     = evaluation.technicalScore || 0;
    question.clarityScore       = evaluation.clarityScore || 0;
    question.problemSolvingScore = evaluation.problemSolvingScore || 0;
    question.sentiment    = sentiment;
    await question.save();

    // Update contextual memory on Interview
    await Interview.findByIdAndUpdate(question.interviewId, {
      $push: {
        contextualMemory: {
          questionText: question.questionText,
          answerSummary: answer.substring(0, 200),
          keyTopics: sentiment.keyTopics || []
        }
      }
    });

    res.json({ ...question.toObject(), evaluation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving answer' });
  }
};

// ── Adaptive Follow-up ────────────────────────────────────────────────────
exports.getFollowUp = async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const interview = await Interview.findById(question.interviewId);
    if (!interview || interview.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const followUpData = await generateFollowUp(
      question.questionText, answer, interview.contextualMemory || []
    );

    // Save follow-up as a new question
    const totalQ = await Question.countDocuments({ interviewId: question.interviewId });
    const followUpQ = new Question({
      interviewId: question.interviewId,
      questionText: followUpData.questionText,
      questionType: followUpData.questionType || 'Technical',
      isFollowUp: true,
      parentQuestionId: question._id,
      order: totalQ
    });
    await followUpQ.save();

    res.json(followUpQ);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error generating follow-up' });
  }
};

// ── Get Report (with coaching) ────────────────────────────────────────────
exports.getReport = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId).populate('resumeId');
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    if (interview.userId.toString() !== req.user.userId) return res.status(403).json({ message: 'Unauthorized access' });

    const questions = await Question.find({ interviewId: req.params.interviewId }).sort({ order: 1 });

    const answered = questions.filter(q => q.userAnswer);
    const totalScore = answered.reduce((acc, q) => acc + q.score, 0);
    const avgScore   = answered.length > 0 ? (totalScore / answered.length).toFixed(2) : 0;
    const avgTech    = answered.length > 0 ? (answered.reduce((a, q) => a + q.technicalScore, 0) / answered.length).toFixed(1) : 0;
    const avgClarity = answered.length > 0 ? (answered.reduce((a, q) => a + q.clarityScore, 0) / answered.length).toFixed(1) : 0;
    const avgPS      = answered.length > 0 ? (answered.reduce((a, q) => a + q.problemSolvingScore, 0) / answered.length).toFixed(1) : 0;

    let roadmap = interview.improvementRoadmap;
    if (!roadmap && answered.length > 0) {
      roadmap = await generateRoadmap(answered);
    }

    let coachingReportData = {
      coachingReport: interview.coachingReport || '',
      strongPoints: interview.strongPoints || [],
      improvementAreas: interview.improvementAreas || [],
      suggestedResources: interview.suggestedResources || []
    };

    // Generate coaching report if not already done
    if (!interview.coachingReport && answered.length > 0) {
      const coaching = await generateCoachingReport(answered, interview.persona || 'Technical');
      coachingReportData = {
        coachingReport: coaching.coachingReport || '',
        strongPoints: coaching.strongPoints || [],
        improvementAreas: coaching.improvementAreas || [],
        suggestedResources: coaching.suggestedResources || []
      };
    }

    const updatedInterview = await Interview.findByIdAndUpdate(
      req.params.interviewId,
      {
        $set: {
          totalScore: avgScore,
          technicalScore: avgTech,
          clarityScore: avgClarity,
          problemSolvingScore: avgPS,
          completed: true,
          improvementRoadmap: roadmap,
          ...coachingReportData
        }
      },
      { new: true }
    ).populate('resumeId');

    res.json({ interview: updatedInterview, questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error generating report' });
  }
};

// ── Get History ────────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.userId, completed: true })
      .populate('resumeId')
      .sort({ interviewDate: -1 });
    res.json(interviews);
  } catch (err) {
    console.error('Error fetching interview history:', err);
    res.status(500).json({ message: 'Server error fetching history' });
  }
};

// ── Get Hint ──────────────────────────────────────────────────────────────
exports.getHint = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    
    const interview = await Interview.findById(question.interviewId);
    if (!interview || interview.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const hint = await getQuestionHint(question.questionText);
    res.json({ hint });
  } catch (err) {
    console.error('Error generating hint:', err);
    res.status(500).json({ message: 'Error generating hint' });
  }
};
