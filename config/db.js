// backend/config/db.js
import mongoose from 'mongoose';

export const connectToDatabase = async () => {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📂 Available collections: ${collections.map(c => c.name).join(', ') || 'None'}`);

    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};
