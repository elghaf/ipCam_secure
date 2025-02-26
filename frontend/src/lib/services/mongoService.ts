import { Camera, DetectionZone } from '@/lib/types';

class MongoService {
  private baseUrl = '/api';

  async addCamera(cameraData: Partial<Camera>, userId: string) {
    const response = await fetch(`${this.baseUrl}/cameras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...cameraData,
        userId,
      }),
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to add camera');
    }

    return result.data;
  }

  async getCameras(userId: string) {
    const response = await fetch(`${this.baseUrl}/cameras?userId=${userId}`);
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to fetch cameras');
    }
    
    return result.data;
  }

  async deleteCamera(id: string) {
    try {
      const response = await fetch(`${this.baseUrl}/cameras/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // First check if the response is OK before trying to parse JSON
      if (!response.ok) {
        // Try to get error details if available in JSON format
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to delete camera: ${response.status}`);
        } catch (jsonError) {
          // If we can't parse JSON, throw a generic error with status code
          throw new Error(`Failed to delete camera: ${response.status}`);
        }
      }

      // Parse the successful response
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete camera');
      }

      return result;
    } catch (error) {
      console.error('Delete camera error:', error);
      throw error;
    }
  }

  async configureZones(cameraId: string, zones: DetectionZone[]) {
    const response = await fetch(`${this.baseUrl}/cameras/${cameraId}/zones`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ zones }),
    });
    if (!response.ok) {
      throw new Error('Failed to configure zones');
    }
    return response.json();
  }

  async updateCamera(id: string, data: Partial<Camera>) {
    const response = await fetch(`${this.baseUrl}/cameras/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // First check if the response is OK before trying to parse JSON
    if (!response.ok) {
      // Try to get error details if available in JSON format
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update camera: ${response.status}`);
      } catch (jsonError) {
        // If we can't parse JSON, throw a generic error with status code
        throw new Error(`Failed to update camera: ${response.status}`);
      }
    }

    // Parse the successful response
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to update camera');
    }

    return result.data;
  }

  async toggleCamera(id: string) {
    try {
      // First get the current camera state
      const response = await fetch(`${this.baseUrl}/cameras/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to get camera: ${response.status}`);
      }
      const camera = await response.json();
      
      // Toggle the enabled state
      const updatedData = {
        enabled: !camera.data.enabled
      };

      // Update the camera
      return await this.updateCamera(id, updatedData);
    } catch (error) {
      console.error('Toggle camera error:', error);
      throw error;
    }
  }
}

export const mongoService = new MongoService();
