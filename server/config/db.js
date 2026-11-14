import mongoose from 'mongoose';

const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
        console.warn('⚠️  MONGODB_URI is not defined in environment variables. Skipping MongoDB connection.');
        return;
    }

    try {
        const conn = await mongoose.connect(mongoUri);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
