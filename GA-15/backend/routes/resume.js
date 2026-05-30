const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadResume, getResume } = require('../controllers/resumeController');
const auth = require('../middlewares/auth');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

router.post('/upload', auth, upload.single('resume'), uploadResume);
router.get('/:id', auth, getResume);

module.exports = router;
