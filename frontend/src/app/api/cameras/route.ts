import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';

// Singleton pattern for MongoDB connection
let client: MongoClient | null = null;

async function connectToDatabase() {
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.MONGODB_DATABASE);
    
    const cameras = await db.collection('cameras')
      .find({ userId })
      .toArray();

    return NextResponse.json({
      success: true,
      data: cameras.map(camera => ({
        ...camera,
        id: camera._id.toString()
      }))
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cameras' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await connectToDatabase();
    const db = client.db(process.env.MONGODB_DATABASE);
    
    // Ensure required fields are present
    if (!body.name || !body.userId) {
      return NextResponse.json(
        { error: 'Name and userId are required' },
        { status: 400 }
      );
    }

    const cameraData = {
      ...body,
      createdAt: Date.now(),
      status: 'offline',
      name: body.name,
      userId: body.userId
    };
    
    const result = await db.collection('cameras').insertOne(cameraData);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...cameraData
      }
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add camera' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const client = await connectToDatabase();
    const db = client.db(process.env.MONGODB_DATABASE);
    
    const result = await db.collection('cameras').findOneAndUpdate(
      { _id: new ObjectId(params.id) },
      { $set: body },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Camera not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        id: result._id.toString()
      }
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update camera' },
      { status: 500 }
    );
  }
} 