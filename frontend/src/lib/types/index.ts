import { CameraFormData } from './detectionTypes';

export interface Camera {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  userId: string;
  createdAt: number;
  updatedAt: number;
  configuration?: CameraFormData;
}
