import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const MONGO_URL = process.env.MONGO_URL;
const connectDB = async () => {
  try {
    // mongoDB와 연결
    await mongoose.connect(MONGO_URL);
    console.log("MongoDB 연결됨");
  } catch (err) {
    console.log("MongoDB 연결 안됨", err);
    process.exit(1);
  }
};

export default connectDB;
