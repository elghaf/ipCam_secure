/**
 * Represents a detection zone in a camera's field of view
 */
export interface DetectionZone {
  id: string;
  name: string;
  points: { x: number; y: number }[];
}

/**
 * Represents a detection event from the camera system
 */
export interface DetectionEvent {
  id: string;
  cameraId: string;
  timestamp: number;
  type: 'motion' | 'object' | 'face';
  confidence: number;
  zone: string;
}

/**
 * Configuration for detection settings on a camera
 */
export interface DetectionConfig {
  camera_id: string;
  zones: DetectionZone[];
  min_area?: number;
  blur_size?: number;
} 

export interface Point {
  x: number;
  y: number;
}

export interface CameraConfiguration {
  sensitivity: number;
  minObjectSize: number;
  maxObjectSize: number;
}

export interface CameraFormData {
  name: string;
  type: 'ip' | 'video' | 'webcam';
  url?: string;
  enabled?: boolean;
  detectionZones?: DetectionZone[];
  configuration?: CameraConfiguration;
}
