// Camera and detection related types

export interface Point {
  x: number;
  y: number;
}

export interface DetectionZone {
  id: string;
  name: string;
  points: Point[];
}

export interface CameraConfiguration {
  sensitivity: number;
  minObjectSize: number;
  maxObjectSize: number;
}

export interface Camera {
  id: string;
  name: string;
  type: string;
  url: string;
  enabled: boolean;
  createdAt: number;
  userId: string;
  status: 'online' | 'offline' | 'error';
  detectionZones: DetectionZone[];
  configuration: CameraConfiguration;
}

export interface DetectionEvent {
  id?: string;
  camera_id: string;
  timestamp: number;
  zone_index: number;
  motion_area: number;
  snapshot_url?: string;
}

// Device information type
export interface DeviceInfo {
  deviceId?: string;
  name: string;
  type: string;
  os: string;
  browser?: string;
  ip?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    country?: string;
    city?: string;
  };
  capabilities?: {
    camera: boolean;
    microphone: boolean;
    gpu: boolean;
  };
  registeredAt?: number;
  lastSeen?: number;
  status?: {
    online: boolean;
    batteryLevel?: number;
    networkType?: string;
    cpuUsage?: number;
    memoryUsage?: number;
  };
}

// Application state type
export interface AppState {
  userId: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    layout: string;
    dashboardConfig: any;
  };
  lastViewedCamera?: string;
  lastViewedTimestamp?: number;
  filters?: {
    dateRange?: [number, number];
    eventTypes?: string[];
    cameras?: string[];
  };
  updatedAt?: number;
}
