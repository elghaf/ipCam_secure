/**
 * Represents a camera in the system
 */
export interface Camera {
    /** Unique identifier for the camera */
    id: string;
    /** Display name of the camera */
    name: string;
    /** Type of camera source */
    type: 'ip' | 'video';
    /** Stream URL for IP cameras or stored URL for video files */
    url?: string;
    /** Video file for upload (temporary, not stored in database) */
    file?: File;
    /** Whether the camera is currently active */
    enabled: boolean;
    /** Unix timestamp of when the camera was added */
    createdAt: number;
    /** ID of the user who owns this camera */
    userId: string;
    /** Current operational status of the camera */
    status: 'online' | 'offline' | 'error';
    /** Last error message if status is 'error' */
    lastError?: string;
  }
  
  /**
   * Represents the state of a video file upload
   */
  export interface VideoUpload {
    /** The video file being uploaded */
    file: File;
    /** Upload progress percentage (0-100) */
    progress: number;
    /** Error message if upload failed */
    error?: string;
  }
  
  /**
   * Form data for creating or updating a camera
   */
  export interface CameraFormData {
    /** Display name for the camera */
    name: string;
    /** Type of camera source */
    type: 'ip' | 'video';
    /** Stream URL for IP cameras */
    url?: string;
    /** Video file for upload (only for type: 'video') */
    file?: File;
  } 