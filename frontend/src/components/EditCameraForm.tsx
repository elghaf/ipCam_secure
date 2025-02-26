import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Trash2, Square, CheckSquare, Undo } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { mongoService } from '@/lib/services/mongoService';

interface CameraData {
  _id: string;
  name: string;
  type: 'ip' | 'video' | 'webcam';
  url: string;
  enabled: boolean;
  userId: string;
  status: string;
  detectionZones: Array<{
    id: string;
    name: string;
    points: Array<{ x: number; y: number }>;
  }>;
  configuration: {
    sensitivity: number;
    minObjectSize: number;
    maxObjectSize: number;
  };
}

interface EditCameraFormProps {
  camera: CameraData;
  onSubmit: (updatedCamera: CameraData) => Promise<void>;
  onCancel: () => void;
}

export default function EditCameraForm({ camera, onSubmit, onCancel }: EditCameraFormProps) {
  const { user } = useAuth();
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentZone, setCurrentZone] = useState<Array<{ x: number; y: number }>>([]);
  const [zones, setZones] = useState(camera.detectionZones.map(zone => ({ points: zone.points })));
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [formData, setFormData] = useState({
    name: camera.name,
    type: camera.type,
    url: camera.url,
    enabled: camera.enabled,
    configuration: camera.configuration
  });

  // Add useEffect to load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Set video preview URL if it's a video type camera
        if (camera.type === 'video' && camera.url) {
          setVideoPreviewUrl(camera.url);
        }

        // Load video/stream
        if (videoRef.current) {
          if (camera.type === 'ip' && camera.url) {
            videoRef.current.src = camera.url;
          } else if (camera.type === 'video' && camera.url) {
            videoRef.current.src = camera.url;
          } else if (camera.type === 'webcam') {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setWebcamStream(stream);
            videoRef.current.srcObject = stream;
          }
          
          await videoRef.current.play();
          setVideoLoaded(true);
        }

        // Log initial data loaded from database
        console.log('Loaded Camera Initial Data:', {
          cameraId: camera._id,
          basicInfo: {
            name: camera.name,
            type: camera.type,
            url: camera.url,
            enabled: camera.enabled,
            status: camera.status
          },
          detectionZones: camera.detectionZones,
          configuration: camera.configuration,
          videoPreviewUrl: videoPreviewUrl,
          isVideoLoaded: videoLoaded
        });

      } catch (error) {
        console.error('Error loading camera data:', error);
        toast.error('Failed to load camera data');
      }
    };

    loadInitialData();

    // Cleanup function
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.srcObject = null;
      }
    };
  }, [camera]);

  // Reuse the video setup and canvas drawing logic from AddCameraForm
  // ... [Include all the useEffect hooks and drawing functions from AddCameraForm] ...

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to edit a camera");
      return;
    }

    try {
      setIsSubmitting(true);

      let videoUrl = formData.url;
      
      // Handle video file upload if changed
      if (formData.type === 'video' && videoPreviewUrl && videoPreviewUrl !== camera.url) {
        const fileFormData = new FormData();
        fileFormData.append('video', formData.file as File);
        fileFormData.append('userId', user.uid);

        try {
          const response = await fetch('/api/upload-video', {
            method: 'POST',
            body: fileFormData,
            // Add these headers for large file uploads
            headers: {
              'Accept': 'application/json',
            }
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Upload failed: ${error}`);
          }

          const { fileUrl } = await response.json();
          videoUrl = fileUrl;

          console.log('Video upload successful:', {
            originalFile: formData.file,
            uploadedUrl: fileUrl
          });
        } catch (error) {
          console.error('Video upload error:', error);
          toast.error('Failed to upload video file: File might be too large');
          return;
        }
      }

      const updatedCamera: CameraData = {
        ...camera,
        name: formData.name,
        type: formData.type,
        url: videoUrl,
        enabled: formData.enabled,
        detectionZones: zones.map((zone, index) => ({
          id: `zone-${index + 1}`,
          name: `Zone ${index + 1}`,
          points: zone.points
        })),
        configuration: formData.configuration
      };

      // Log the update
      console.log('Updating Camera:', {
        original: camera,
        updated: updatedCamera,
        changes: {
          name: camera.name !== updatedCamera.name,
          type: camera.type !== updatedCamera.type,
          url: camera.url !== updatedCamera.url,
          zonesChanged: JSON.stringify(camera.detectionZones) !== JSON.stringify(updatedCamera.detectionZones),
          configChanged: JSON.stringify(camera.configuration) !== JSON.stringify(updatedCamera.configuration)
        }
      });

      await mongoService.updateCamera(updatedCamera);
      await onSubmit(updatedCamera);
      
      toast.success("Camera updated successfully");
    } catch (error) {
      console.error('Error updating camera:', error);
      toast.error('Failed to update camera');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Edit Camera</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Camera Name</label>
            <Input
              placeholder="Enter camera name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Camera Type</label>
            <Select
              value={formData.type}
              onValueChange={(value: 'ip' | 'video' | 'webcam') => {
                setFormData({ ...formData, type: value });
                setVideoLoaded(false);
                setVideoPreviewUrl(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select camera type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ip">IP Camera</SelectItem>
                <SelectItem value="webcam">Webcam</SelectItem>
                <SelectItem value="video">Video File</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configuration fields */}
          <div className="col-span-2">
            <h3 className="text-lg font-semibold mb-2">Detection Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sensitivity</label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.configuration.sensitivity}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: {
                      ...formData.configuration,
                      sensitivity: parseFloat(e.target.value)
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min Object Size</label>
                <Input
                  type="number"
                  value={formData.configuration.minObjectSize}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: {
                      ...formData.configuration,
                      minObjectSize: parseInt(e.target.value)
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Object Size</label>
                <Input
                  type="number"
                  value={formData.configuration.maxObjectSize}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: {
                      ...formData.configuration,
                      maxObjectSize: parseInt(e.target.value)
                    }
                  })}
                />
              </div>
            </div>
          </div>
          
          {formData.type === 'ip' && (
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Camera URL</label>
              <Input
                placeholder="rtsp:// or http:// stream URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
          )}
          
          {formData.type === 'video' && (
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Video File</label>
              <div className="space-y-2">
                {camera.url && (
                  <div className="text-sm text-gray-500">
                    Current video: {camera.url}
                  </div>
                )}
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setVideoPreviewUrl(url);
                      setFormData({ ...formData, url: '' }); // Clear old URL since we're uploading new file
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Add enabled toggle */}
          <div className="col-span-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="form-checkbox"
              />
              <span className="text-sm font-medium">Camera Enabled</span>
            </label>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Card>
  );
} 