const Resume = require('../models/Resume');
const { extractTextFromPDF } = require('../utils/pdfParser');
const { analyzeResume } = require('../utils/gemini');

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const extractedText = await extractTextFromPDF(req.file.buffer);
    const skills = await analyzeResume(extractedText);

    const resume = new Resume({
      userId: req.user.userId,
      extractedText,
      detectedSkills: skills
    });

    await resume.save();
    res.status(201).json(resume);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error parsing resume' });
  }
};

exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (resume.userId.toString() !== req.user.userId) return res.status(401).json({ message: 'Not authorized' });

    res.json(resume);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
