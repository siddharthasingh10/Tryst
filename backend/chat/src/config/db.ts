import mongoose from 'mongoose';
import dotenv from 'dotenv';
const connectDB= async () => {
    const url = process.env.MONGO_URI || "" ;
    if(!url) {
        console.error('MongoDB URI is not defined in environment variables');   
    }
    try {
        await mongoose.connect(url, {
            dbName: 'tryst',
      
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}
export default connectDB;