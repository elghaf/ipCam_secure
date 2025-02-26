import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import { Camera, DetectionEvent, DetectionZone, DeviceInfo, AppState } from '@/lib/types';

// MongoDB Atlas connection string
const uri = process.env.NEXT_PUBLIC_MONGODB_URI || "mongodb+srv://testo:testo@storagecam.pgkdn.mongodb.net/?appName=storagecam";
const dbName = process.env.NEXT_PUBLIC_MONGODB_DATABASE || "storagecam";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Collections
const collections = {
  cameras: () => client.db(dbName).collection('cameras'),
  detection_events: () => client.db(dbName).collection('detection_events'),
  detection_zones: () => client.db(dbName).collection('detection_zones'),
  device_info: () => client.db(dbName).collection('device_info'),
  app_state: () => client.db(dbName).collection('app_state')
};

export const mongoDBService = {
  // Connection management
  async connect(): Promise<void> {
    try {
      await client.connect();
      console.log("Connected to MongoDB Atlas");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  },

  async disconnect(): Promise<void> {
    await client.close();
    console.log("Disconnected from MongoDB Atlas");
  },

  async testConnection(): Promise<boolean> {
    try {
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
      return true;
    } catch (error) {
      console.error("MongoDB connection test failed:", error);
      return false;
    }
  },

  // Camera operations
  async getCameras(userId: string): Promise<Camera[]> {
    try {
      const camerasCollection = collections.cameras();
      const result = await camerasCollection.find({ userId }).toArray();
      return result.map(doc => ({
        ...doc,
        id: doc._id.toString()
      })) as Camera[];
    } catch (error) {
      console.error("Error getting cameras:", error);
      throw error;
    }
  },
  
  async addCamera(data: any, userId: string): Promise<Camera> {
    try {
      const camerasCollection = collections.cameras();
      const cameraData = {
        ...data,
        userId,
        createdAt: new Date().getTime()
      };
      
      const result = await camerasCollection.insertOne(cameraData);
      return {
        ...cameraData,
        id: result.insertedId.toString()
      } as Camera;
    } catch (error) {
      console.error("Error adding camera:", error);
      throw error;
    }
  },
  
  async updateCamera(id: string, data: Partial<Camera>): Promise<Camera> {
    try {
      const camerasCollection = collections.cameras();
      await camerasCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: data }
      );
      
      const updatedCamera = await camerasCollection.findOne({ _id: new ObjectId(id) });
      return {
        ...updatedCamera,
        id: updatedCamera._id.toString()
      } as Camera;
    } catch (error) {
      console.error("Error updating camera:", error);
      throw error;
    }
  },
  
  async deleteCamera(id: string): Promise<void> {
    try {
      const camerasCollection = collections.cameras();
      await camerasCollection.deleteOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error("Error deleting camera:", error);
      throw error;
    }
  },
  
  // Detection events operations
  async getEvents(cameraId: string, startTime: number, endTime: number): Promise<DetectionEvent[]> {
    try {
      const eventsCollection = collections.detection_events();
      const result = await eventsCollection.find({
        cameraId,
        timestamp: {
          $gte: startTime,
          $lte: endTime
        }
      }).sort({ timestamp: -1 }).toArray();
      
      return result.map(doc => ({
        ...doc,
        id: doc._id.toString()
      })) as DetectionEvent[];
    } catch (error) {
      console.error("Error getting events:", error);
      throw error;
    }
  },
  
  async addEvent(eventData: Omit<DetectionEvent, 'id'>): Promise<string> {
    try {
      const eventsCollection = collections.detection_events();
      const result = await eventsCollection.insertOne({
        ...eventData,
        timestamp: eventData.timestamp || new Date().getTime()
      });
      return result.insertedId.toString();
    } catch (error) {
      console.error("Error adding event:", error);
      throw error;
    }
  },
  
  // Detection zones operations
  async configureZones(cameraId: string, zones: DetectionZone[]): Promise<void> {
    try {
      const zonesCollection = collections.detection_zones();
      await zonesCollection.updateOne(
        { cameraId },
        { $set: { zones } },
        { upsert: true }
      );
    } catch (error) {
      console.error("Error configuring zones:", error);
      throw error;
    }
  },
  
  async getZones(cameraId: string): Promise<DetectionZone[]> {
    try {
      const zonesCollection = collections.detection_zones();
      const result = await zonesCollection.findOne({ cameraId });
      return result?.zones || [];
    } catch (error) {
      console.error("Error getting zones:", error);
      throw error;
    }
  },
  async registerDevice(deviceInfo: DeviceInfo): Promise<string> {
    try {
      const deviceCollection = collections.device_info();
      const now = new Date().getTime();
      
      if (deviceInfo.deviceId) {
        // Update existing device
        await deviceCollection.updateOne(
          { deviceId: deviceInfo.deviceId },
          { 
            $set: {
              ...deviceInfo,
              lastSeen: now
            }
          },
          { upsert: true }
        );
        return deviceInfo.deviceId;
      } else {
        // Create new device
        const newDevice = {
          ...deviceInfo,
          registeredAt: now,
          lastSeen: now
        };
        const result = await deviceCollection.insertOne(newDevice);
        return result.insertedId.toString();
      }
    } catch (error) {
      console.error("Error registering device:", error);
      throw error;
    }
  }
  
  async updateDeviceStatus(deviceId: string, status: any): Promise<void> {
    try {
      const deviceCollection = collections.device_info();
      await deviceCollection.updateOne(
        { deviceId },
        {
          $set: {
            status,
            lastSeen: new Date().getTime()
          }
        }
      );
    } catch (error) {
      console.error("Error updating device status:", error);
      throw error;
    }
  },
  
  async getDeviceInfo(deviceId: string): Promise<DeviceInfo> {
    try {
      const deviceCollection = collections.device_info();
      const result = await deviceCollection.findOne({ deviceId });
      return result as DeviceInfo;
    } catch (error) {
      console.error("Error getting device info:", error);
      throw error;
    }
  },
  
  // Application state operations
  async saveAppState(userId: string, state: AppState): Promise<void> {
    try {
      const stateCollection = collections.app_state();
      await stateCollection.updateOne(
        { userId },
        {
          $set: {
            state,
            updatedAt: new Date().getTime()
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error("Error saving app state:", error);
      throw error;
    }
  },
  
  async getAppState(userId: string): Promise<AppState> {
    try {
      const stateCollection = collections.app_state();
      const result = await stateCollection.findOne({ userId });
      return result?.state as AppState || null;
    } catch (error) {
      console.error("Error getting app state:", error);
      throw error;
    }
  }
};

// Initialize connection when the service is imported
mongoDBService.connect().catch(console.error);
