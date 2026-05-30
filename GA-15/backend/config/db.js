const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn("⚠️ MONGO_URI is undefined in your .env file. Falling back to local MongoDB...");
    return connectLocalFallback();
  }

  try {
    console.log("🔍 Connecting to MongoDB Atlas...");
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // Timeout in 5 seconds to avoid freezing the startup if blocked
    });

    console.log(`✅ MongoDB Connected (Atlas): ${conn.connection.host}`);
    return;

  } catch (err) {
    console.error(`❌ MongoDB Atlas connection error:`, err.message);
    console.log("⚠️ This is often caused by firewall/network blocks, DNS resolution failure, or because your current IP address is not whitelisted in MongoDB Atlas.");
    console.log("🔄 Attempting to connect to Local MongoDB fallback...");
    return connectLocalFallback();
  }
};

const connectLocalFallback = async () => {
  const localUri = 'mongodb://127.0.0.1:27017/prepvox';
  try {
    console.log(`🔍 Connecting to Local MongoDB at ${localUri}...`);
    const conn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`✅ MongoDB Connected (Local Fallback): ${conn.connection.host}`);
  } catch (localErr) {
    console.error("❌ Local MongoDB connection failed:", localErr.message);
    console.error("\n==================================================================");
    console.error("  CRITICAL DATABASE CONNECTION ERROR");
    console.error("  Could not connect to MongoDB Atlas OR Local MongoDB.");
    console.error("  Please ensure either:");
    console.error("  1. Your internet is working and your IP is whitelisted on Atlas");
    console.error("  2. Local MongoDB is running. Run 'start-mongo.bat' in the project root.");
    console.error("==================================================================\n");
    process.exit(1);
  }
};

module.exports = connectDB;