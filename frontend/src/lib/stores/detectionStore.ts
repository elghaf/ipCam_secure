import { create } from 'zustand';
import { DetectionEvent, DetectionZone } from '@/lib/types';
import { mongoService } from '@/lib/services/mongoService';

interface DetectionStore {
  events: DetectionEvent[];
  loading: boolean;
  error: string | null;
  configuredCameras: Record<string, DetectionZone[]>;

  getEvents: (cameraId: string, startTime: number, endTime: number) => Promise<void>;
  configureDetection: (config: { camera_id: string; zones: DetectionZone[] }) => Promise<void>;
  getZones: (cameraId: string) => Promise<DetectionZone[]>;
  clearZones: (cameraId: string) => Promise<void>;
}

export const useDetectionStore = create<DetectionStore>((set, get) => ({
  events: [],
  loading: false,
  error: null,
  configuredCameras: {},

  getEvents: async (cameraId, startTime, endTime) => {
    set({ loading: true, error: null });
    try {
      const events = await mongoService.getEvents(cameraId, startTime, endTime);
      set({ events, loading: false });
    } catch (error: any) {
      console.error('Error fetching detection events:', error);
      set({ error: error.message, loading: false });
    }
  },

  configureDetection: async (config: { camera_id: string; zones: DetectionZone[] }) => {
    try {
      console.log("Configuring detection for camera:", config.camera_id);
      console.log("Zones to save:", config.zones);
      
      await mongoService.configureZones(config.camera_id, config.zones);
      console.log(`Detection zones updated for camera ${config.camera_id}`);
      
      // Update local state
      set((state) => ({
        configuredCameras: {
          ...state.configuredCameras,
          [config.camera_id]: config.zones,
        }
      }));
    } catch (error: any) {
      console.error('Error configuring detection:', error);
      set({ error: error.message });
      throw error;
    }
  },

  getZones: async (cameraId: string) => {
    // First check our local state
    const state = get();
    if (state.configuredCameras[cameraId]) {
      return state.configuredCameras[cameraId];
    }
    
    try {
      const zones = await mongoService.getZones(cameraId);
      console.log(`Retrieved zones for camera ${cameraId}:`, zones);
      
      // Update local state
      set((state) => ({
        configuredCameras: {
          ...state.configuredCameras,
          [cameraId]: zones,
        }
      }));
      
      return zones;
    } catch (error: any) {
      console.error(`Error retrieving zones for camera ${cameraId}:`, error);
      return [];
    }
  },

  clearZones: async (cameraId: string) => {
    try {
      await mongoService.configureZones(cameraId, []);
      console.log(`Detection zones cleared for camera ${cameraId}`);
      
      // Update local state
      set((state) => ({
        configuredCameras: {
          ...state.configuredCameras,
          [cameraId]: [],
        }
      }));
    } catch (error: any) {
      console.error('Error clearing zones:', error);
      set({ error: error.message });
      throw error;
    }
  }
}));

// Helper function for debugging
function debugStoredZones() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      console.log("All stored zones:", JSON.parse(stored));
    } else {
      console.log("No zones stored in localStorage");
    }
  } catch (error) {
    console.error("Error debugging stored zones:", error);
  }
}
