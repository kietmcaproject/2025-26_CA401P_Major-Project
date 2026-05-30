const express = require('express');
const router = express.Router();
const {
  startInterview, getQuestions, submitAnswer, getReport,
  getHistory, getHint, getFollowUp
} = require('../controllers/interviewController');
const auth = require('../middlewares/auth');

router.post('/start',              auth, startInterview);
router.get('/questions/:interviewId', auth, getQuestions);
router.post('/answer',             auth, submitAnswer);
router.post('/followup',           auth, getFollowUp);
router.get('/report/:interviewId', auth, getReport);
router.get('/history',             auth, getHistory);
router.get('/hint/:questionId',    auth, getHint);

module.exports = router;
