import { create } from 'zustand';
import { Camera } from '@/lib/types';

interface CameraStore {
  cameras: Camera[];
  loading: boolean;
  error: string | null;
  uploadProgress: number;
  
  addCamera: (data: any, userId: string) => Promise<void>;
  updateCamera: (id: string, data: Partial<Camera>) => Promise<void>;
  deleteCamera: (id: string) => Promise<void>;
  loadCameras: (userId: string) => void;
}

const STORAGE_KEY = 'local_cameras';

export const useCameraStore = create<CameraStore>((set, get) => ({
  cameras: [],
  loading: false,
  error: null,
  uploadProgress: 0,

  loadCameras: (userId: string) => {
    try {
      const storedCameras = localStorage.getItem(STORAGE_KEY);
      const cameras = storedCameras ? JSON.parse(storedCameras) : [];
      set({ cameras: cameras.filter((cam: Camera) => cam.userId === userId) });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addCamera: async (data: any, userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const newCamera: Camera = {
        id: Date.now().toString(),
        name: data.name,
        type: data.type,
        url: data.url || '',
        enabled: true,
        createdAt: Date.now(),
        userId,
        status: 'offline'
      };

      const storedCameras = localStorage.getItem(STORAGE_KEY);
      const cameras = storedCameras ? JSON.parse(storedCameras) : [];
      cameras.push(newCamera);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cameras));
      set((state) => ({ 
        cameras: [...state.cameras, newCamera],
        loading: false 
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateCamera: async (id: string, data: Partial<Camera>) => {
    try {
      set({ loading: true, error: null });
      
      const storedCameras = localStorage.getItem(STORAGE_KEY);
      let cameras = storedCameras ? JSON.parse(storedCameras) : [];
      
      cameras = cameras.map((cam: Camera) => 
        cam.id === id ? { ...cam, ...data } : cam
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cameras));
      set((state) => ({
        cameras: state.cameras.map(cam => 
          cam.id === id ? { ...cam, ...data } : cam
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteCamera: async (id: string) => {
    try {
      set({ loading: true, error: null });
      
      const storedCameras = localStorage.getItem(STORAGE_KEY);
      let cameras = storedCameras ? JSON.parse(storedCameras) : [];
      
      cameras = cameras.filter((cam: Camera) => cam.id !== id);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cameras));
      set((state) => ({
        cameras: state.cameras.filter(cam => cam.id !== id),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  }
})); 
