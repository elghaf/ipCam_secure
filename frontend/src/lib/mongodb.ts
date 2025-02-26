import { MongoClient } from 'mongodb';

// Singleton pattern for MongoDB connection
let client: MongoClient | null = null;

export async function connectToDatabase() {
  if (client) return client;

  if (!process.env.MONGODB_URI) {
    throw new Error('Please add your MongoDB URI to .env.local');
  }

  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    return client;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Failed to connect to database');
  }
} 