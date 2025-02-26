import { create } from 'zustand';
import { Camera, CameraFormData } from '@/lib/types';
import { mongoService } from '@/lib/services/mongoService';

interface CameraStore {
  cameras: Camera[];
  loading: boolean;
  error: string | null;
  
  addCamera: (data: CameraFormData, userId: string) => Promise<void>;
  updateCamera: (id: string, data: Partial<Camera>) => Promise<void>;
  deleteCamera: (id: string) => Promise<void>;
  toggleCamera: (id: string) => Promise<void>;
  loadCameras: (userId: string) => Promise<void>;
  configureDetection: (cameraId: string, config: any) => Promise<void>;
}

export const useCameraStore = create<CameraStore>((set) => ({
  cameras: [],
  loading: false,
  error: null,

  addCamera: async (data, userId) => {
    try {
      const newCamera = await mongoService.addCamera(data, userId);
      set(state => ({ cameras: [...state.cameras, newCamera] }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateCamera: async (id, data) => {
    try {
      const updatedCamera = await mongoService.updateCamera(id, data);
      set(state => ({
        cameras: state.cameras.map(c => 
          c.id === id ? updatedCamera : c
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteCamera: async (id: string) => {
    try {
      const result = await mongoService.deleteCamera(id);
      if (result.success) {
        set(state => ({
          cameras: state.cameras.filter(c => c.id !== id)
        }));
      } else {
        throw new Error(result.error || 'Failed to delete camera');
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  toggleCamera: async (id) => {
    try {
      const updatedCamera = await mongoService.toggleCamera(id);
      set(state => ({
        cameras: state.cameras.map(c => 
          c.id === id ? updatedCamera : c
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  configureDetection: async (cameraId, config) => {
    try {
      await mongoService.configureZones(cameraId, config.zones);
      set(state => ({
        cameras: state.cameras.map(c => 
          c.id === cameraId ? { ...c, detectionZones: config.zones } : c
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  loadCameras: async (userId) => {
    try {
      set({ loading: true, error: null });
      const cameras = await mongoService.getCameras(userId);
      set({ cameras, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
})); 
