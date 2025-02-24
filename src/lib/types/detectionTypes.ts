/**
 * Represents a detection zone in a camera's field of view
 */
export interface DetectionZone {
  /** X coordinate of the zone's top-left corner (0-1) */
  x: number;
  /** Y coordinate of the zone's top-left corner (0-1) */
  y: number;
  /** Width of the zone (0-1) */
  width: number;
  /** Height of the zone (0-1) */
  height: number;
  /** Detection sensitivity for this zone (0-1) */
  sensitivity: number;
}

/**
 * Represents a detection event from the camera system
 */
export interface DetectionEvent {
  /** ID of the camera that detected the event */
  camera_id: string;
  /** Unix timestamp of when the event occurred */
  timestamp: number;
  /** Index of the zone where motion was detected */
  zone_index: number;
  /** Percentage of the zone area where motion was detected (0-1) */
  motion_area: number;
  /** Optional URL to a snapshot image of the event */
  snapshot_url?: string;
}

/**
 * Configuration for detection settings on a camera
 */
export interface DetectionConfig {
  /** ID of the camera to configure */
  camera_id: string;
  /** Array of detection zones for this camera */
  zones: DetectionZone[];
  /** Minimum area threshold for motion detection (optional) */
  min_area?: number;
  /** Blur kernel size for noise reduction (optional) */
  blur_size?: number;
} 