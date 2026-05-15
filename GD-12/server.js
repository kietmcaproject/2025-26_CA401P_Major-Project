require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { predictFraud } = require('./aiModel');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mca_final_year_secret_key_123';

app.use(cors());
app.use(express.json());

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  country: { type: String, required: true },
  merchant: { type: String, required: true },
  cvvStatus: { type: String, enum: ['VALID', 'INVALID', 'MISSING'], required: true },
  riskScore: { type: Number, required: true },
  verdict: { type: String, enum: ['LEGITIMATE', 'SUSPICIOUS', 'FRAUD'], required: true },
  timestamp: { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', transactionSchema);

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ message: 'Username already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ _id: user._id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/api/transactions', verifyToken, async (req, res) => {
  try {
    const { amount, country, merchant, cvvStatus } = req.body;
    
    if (!amount || !country || !merchant || !cvvStatus) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const { riskScore, verdict, aiConfidence } = predictFraud({ amount, country, cvvStatus });

    const newTransaction = new Transaction({
      amount, country, merchant, cvvStatus, riskScore, verdict
    });
    const savedTransaction = await newTransaction.save();

    res.status(201).json(savedTransaction);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

app.get('/api/transactions', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ timestamp: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fraud_detection')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));
