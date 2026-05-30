const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// 🔥 Load env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./config/db');

const app = express();

// 🔥 Global crash handlers (VERY IMPORTANT)
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION:", err);
});

const allowedOrigins = ['http://localhost:5173', 'https://prepvox.com', process.env.FRONTEND_URL].filter(Boolean);

// ✅ Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Add raw body parser for webhook BEFORE global express.json()
const paymentController = require('./controllers/paymentController');
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), paymentController.webhookHandler);

app.use(express.json());

// ✅ Health route (important for testing)
app.get('/', (req, res) => {
  res.status(200).send('API is running successfully');
});

// ✅ Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/interview', require('./routes/interview'));
app.use('/api/payment', require('./routes/payment'));

// ❌ 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ❌ Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error middleware:', err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;

// 🚀 Start server
const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is undefined. Check your .env file");
    }

    await connectDB();

    app.listen(PORT, '127.0.0.1', () => {
      console.log(`✅ Server started on port ${PORT}`);
      console.log(`🌐 Local: http://127.0.0.1:${PORT}`);
    });

  } catch (err) {
    console.error('❌ Server failed to start:', err.message);
    process.exit(1);
  }
};

startServer();