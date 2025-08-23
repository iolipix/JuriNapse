import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // MongoDB connection string
    const mongoURI = process.env.MONGODB_URI || 'YOUR_MONGODB_URI_HERE';
    
    await mongoose.connect(mongoURI);
  } catch (error) {
    throw error;
  }
};

export default connectDB;
