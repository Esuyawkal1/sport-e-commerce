import mongoose from "mongoose";

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  isConnecting = true;
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce";

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    isConnecting = false;
    return conn;
  } catch (error) {
    isConnecting = false;
    console.error(`MongoDB connection error: ${error.message}`);
    console.warn(
      "Backend server is running, but database features will be unavailable until MongoDB is running. Retrying in 5 seconds...",
    );
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
