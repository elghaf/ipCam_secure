import { create } from 'zustand';
import { DetectionZone, DetectionConfig, DetectionEvent } from '@/lib/types/detectionTypes';

interface DetectionStore {
  configuredCameras: Record<string, DetectionZone[]>;
  events: DetectionEvent[];
  loading: boolean;
  error: string | null;
  // Actions
  configureDetection: (config: DetectionConfig) => Promise<void>;
  getEvents: (cameraId: string, startTime?: number, endTime?: number) => Promise<void>;
}

// API endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const useDetectionStore = create<DetectionStore>((set, get) => ({
  configuredCameras: {},
  events: [],
  loading: false,
  error: null,

  configureDetection: async (config) => {
    try {
      set({ loading: true, error: null });
      const response = await fetch(`${API_BASE_URL}/detection/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          camera_id: config.camera_id,
          zones: config.zones,
          min_area: config.min_area,
          blur_size: config.blur_size,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to configure detection');
      }

      set((state) => ({
        configuredCameras: {
          ...state.configuredCameras,
          [config.camera_id]: config.zones,
        },
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getEvents: async (cameraId, startTime, endTime) => {
    try {
      set({ loading: true, error: null });
      const params = new URLSearchParams({
        camera_id: cameraId,
        ...(startTime && { start_time: startTime.toString() }),
        ...(endTime && { end_time: endTime.toString() }),
        limit: '100',
      });

      const response = await fetch(`${API_BASE_URL}/detection/events?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch events');
      }

      set({ events: data.events });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
})); 