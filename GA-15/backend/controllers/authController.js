const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || name.trim().length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters long' });
  if (!email || !isValidEmail(email)) return res.status(400).json({ message: 'Invalid email address' });
  if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long' });

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ name: name.trim(), email: email.toLowerCase(), password });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, credits: user.credits } });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });

  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, credits: user.credits } });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Get Me Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCredits = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('credits');
    res.json({ credits: user.credits });
  } catch (err) {
    console.error('Get Credits Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, role, skills, experience, bio } = req.body;
    let user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (name) {
      if (name.trim().length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters long' });
      user.name = name.trim();
    }
    if (role) user.role = role.trim();
    if (skills && Array.isArray(skills)) user.skills = skills.map(s => s.trim()).filter(Boolean);
    if (experience) user.experience = experience.trim();
    if (bio) user.bio = bio.trim();
    
    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, credits: user.credits, role: user.role, skills: user.skills, experience: user.experience, bio: user.bio });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
