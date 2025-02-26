import { useState, useEffect } from 'react';
import { mongoDBService } from '@/lib/services/mongoDBService';
import { Camera, DetectionEvent, DetectionZone, DeviceInfo, AppState } from '@/lib/types';

export function useMongoDBService() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test connection on component mount
    const testConnection = async () => {
      try {
        setIsLoading(true);
        const connected = await mongoDBService.testConnection();
        setIsConnected(connected);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to MongoDB');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    testConnection();

    // Cleanup on unmount
    return () => {
      mongoDBService.disconnect().catch(console.error);
    };
  }, []);

  // Device information methods
  const registerDevice = async (deviceInfo: DeviceInfo): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);
      return await mongoDBService.registerDevice(deviceInfo);
    } catch (err: any) {
      setError(err.message || 'Failed to register device');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDeviceStatus = async (deviceId: string, status: any): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await mongoDBService.updateDeviceStatus(deviceId, status);
    } catch (err: any) {
      setError(err.message || 'Failed to update device status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceInfo = async (deviceId: string): Promise<DeviceInfo> => {
    try {
      setIsLoading(true);
      setError(null);
      return await mongoDBService.getDeviceInfo(deviceId);
    } catch (err: any) {
      setError(err.message || 'Failed to get device info');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // App state methods
  const saveAppState = async (userId: string, state: AppState): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await mongoDBService.saveAppState(userId, state);
    } catch (err: any) {
      setError(err.message || 'Failed to save app state');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getAppState = async (userId: string): Promise<AppState> => {
    try {
      setIsLoading(true);
      setError(null);
      return await mongoDBService.getAppState(userId);
    } catch (err: any) {
      setError(err.message || 'Failed to get app state');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    isLoading,
    error,
    // Device methods
    registerDevice,
    updateDeviceStatus,
    getDeviceInfo,
    // App state methods
    saveAppState,
    getAppState,
    // Camera methods
    getCameras: mongoDBService.getCameras,
    addCamera: mongoDBService.addCamera,
    updateCamera: mongoDBService.updateCamera,
    deleteCamera: mongoDBService.deleteCamera,
    // Event methods
    getEvents: mongoDBService.getEvents,
    addEvent: mongoDBService.addEvent,
    // Zone methods
    configureZones: mongoDBService.configureZones,
    getZones: mongoDBService.getZones,
  };
}
