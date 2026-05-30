const express = require('express');
const router = express.Router();
const { register, login, me, getCredits, updateProfile } = require('../controllers/authController');
const auth = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.get('/credits', auth, getCredits);
router.put('/profile', auth, updateProfile);

module.exports = router;
