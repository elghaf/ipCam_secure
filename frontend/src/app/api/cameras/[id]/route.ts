import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`Updating camera with ID: ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Camera ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('Update data:', body);
    
    const client = await connectToDatabase();
    const db = client.db(process.env.MONGODB_DATABASE);
    
    // Remove id and _id from the update data
    const updateData = { ...body };
    delete updateData.id;
    delete updateData._id;
    
    // Add updatedAt timestamp
    updateData.updatedAt = Date.now();
    console.log('Cleaned update data:', updateData);
    
    // Convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error('Invalid ObjectId format:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid camera ID format' },
        { status: 400 }
      );
    }
    
    console.log('Attempting database update...');
    const result = await db.collection('cameras').findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      console.log('Camera not found in database');
      return NextResponse.json(
        { success: false, error: 'Camera not found' },
        { status: 404 }
      );
    }
    
    console.log('Update successful, returning result');
    // Convert ObjectId to string for the response
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
      { success: false, error: error instanceof Error ? error.message : 'Failed to update camera' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`Deleting camera with ID: ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Camera ID is required' },
        { status: 400 }
      );
    }

    // Convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error('Invalid ObjectId format:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid camera ID format' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.MONGODB_DATABASE);
    
    console.log('Attempting to delete camera...');
    const result = await db.collection('cameras').deleteOne({
      _id: objectId
    });

    if (result.deletedCount === 0) {
      console.log('Camera not found in database');
      return NextResponse.json(
        { success: false, error: 'Camera not found' },
        { status: 404 }
      );
    }

    console.log('Delete successful');
    return NextResponse.json({ 
      success: true,
      message: 'Camera deleted successfully'
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete camera' },
      { status: 500 }
    );
  }
}

