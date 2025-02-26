import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Trash2, Square, CheckSquare, Undo } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { mongoService } from '@/lib/services/mongoService';

interface CameraFormData {
  name: string;
  type: 'ip' | 'video' | 'webcam';
  url: string;
  file?: File;
  detectionZones: Array<{ points: Array<{ x: number; y: number }> }>;
}

interface AddCameraFormProps {
  onSubmit: (data: CameraFormData) => Promise<void>;
  onCancel: () => void;
}

export default function AddCameraForm({ onSubmit, onCancel }: AddCameraFormProps) {
  const { user } = useAuth();
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentZone, setCurrentZone] = useState<Array<{ x: number; y: number }>>([]);
  const [zones, setZones] = useState<Array<{ points: Array<{ x: number; y: number }> }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [formData, setFormData] = useState<CameraFormData>({
    name: "",
    type: "ip",
    url: "",
    file: undefined,
    detectionZones: [],
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let mounted = true;

    const setupVideo = async () => {
      try {
        if (formData.type === 'video' && videoPreviewUrl) {
          video.src = videoPreviewUrl;
        } else if (formData.type === 'ip' && formData.url) {
          video.src = formData.url;
        } else if (formData.type === 'webcam') {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setWebcamStream(stream);
          video.srcObject = stream;
        } else {
          return;
        }

        await video.play();
        
        if (mounted) {
          setVideoLoaded(true);
        }
      } catch (error) {
        console.error('Video setup error:', error);
        if (mounted) {
          setVideoLoaded(false);
          toast.error('Failed to load video source');
        }
      }
    };

    setupVideo();

    return () => {
      mounted = false;
      if (video.srcObject instanceof MediaStream) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
      video.pause();
      video.src = '';
      video.srcObject = null;
    };
  }, [formData.type, formData.url, videoPreviewUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !videoLoaded) return;

    // Set initial canvas size
    const updateCanvasSize = () => {
      const videoWidth = video.videoWidth || video.clientWidth;
      const videoHeight = video.videoHeight || video.clientHeight;
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Force redraw after resize
      drawZones();
    };

    updateCanvasSize();
    video.addEventListener('loadedmetadata', updateCanvasSize);

    // Create animation loop
    let animationFrame: number;
    const animate = () => {
      drawZones();
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      video.removeEventListener('loadedmetadata', updateCanvasSize);
      cancelAnimationFrame(animationFrame);
    };
  }, [videoLoaded, zones, currentZone]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !videoLoaded) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (!isDrawing) {
      setIsDrawing(true);
      setCurrentZone([{ x, y }]);
    } else {
      // Check if clicking near the start point to close the polygon
      const startPoint = currentZone[0];
      const distance = Math.sqrt(
        Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
      );
      
      if (currentZone.length > 2 && distance < 20) {
        handleFinishZone();
      } else {
        setCurrentZone([...currentZone, { x, y }]);
      }
    }
  };

  const handleFinishZone = () => {
    if (currentZone.length > 2) {
      const newZones = [...zones, { points: currentZone }];
      setZones(newZones);
      setFormData({ ...formData, detectionZones: newZones });
    }
    setIsDrawing(false);
    setCurrentZone([]);
  };

  const resetCurrentZone = () => {
    setCurrentZone([]);
    setIsDrawing(false);
  };

  const deleteLastPoint = () => {
    if (currentZone.length > 0) {
      setCurrentZone(currentZone.slice(0, -1));
      if (currentZone.length === 1) {
        setIsDrawing(false);
      }
    }
  };

  const deleteAllZones = () => {
    setZones([]);
    setCurrentZone([]);
    setIsDrawing(false);
    setFormData({ ...formData, detectionZones: [] });
  };

  const validateCameraSettings = () => {
    if (!formData.name) {
      toast.error("Please enter a camera name");
      return false;
    }
    if (formData.type === 'ip' && !formData.url) {
      toast.error("Please enter camera URL");
      return false;
    }
    if (!user) {
      toast.error("You must be logged in to add a camera");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (validateCameraSettings() && user) {
      try {
        setIsSubmitting(true);
        
        // Clean up any active streams
        if (webcamStream) {
          webcamStream.getTracks().forEach(track => track.stop());
        }

        let videoUrl = formData.url;
        
        // Handle video file upload if present
        if (formData.type === 'video' && formData.file) {
          // Create form data for file upload
          const fileFormData = new FormData();
          fileFormData.append('video', formData.file);
          fileFormData.append('userId', user.uid);

          try {
            // Assuming you have an endpoint to handle video uploads
            const response = await fetch('/api/upload-video', {
              method: 'POST',
              body: fileFormData
            });

            if (!response.ok) {
              throw new Error('Failed to upload video file');
            }

            const { fileUrl } = await response.json();
            videoUrl = fileUrl; // Use the uploaded file URL
          } catch (error) {
            console.error('Video upload error:', error);
            toast.error('Failed to upload video file');
            return;
          }
        }
        
        // Prepare camera data for MongoDB
        const cameraData = {
          name: formData.name,
          type: formData.type,
          url: videoUrl || '',  // Use the uploaded video URL if available
          enabled: true,
          createdAt: Date.now(),
          userId: user.uid,
          status: 'offline',
          detectionZones: zones.map((zone, index) => ({
            id: `zone-${index + 1}`,
            name: `Zone ${index + 1}`,
            points: zone.points
          })),
          configuration: {
            sensitivity: 0.5,
            minObjectSize: 30,
            maxObjectSize: 300
          }
        };

        console.log('Camera Data:', {
          ...cameraData,
          videoFile: formData.file ? {
            name: formData.file.name,
            size: formData.file.size,
            type: formData.file.type
          } : null,
          videoPreviewUrl: videoPreviewUrl,
          zones: zones,
          webcamActive: !!webcamStream
        });
        
        // Save to MongoDB using the mongoService
        await mongoService.addCamera(cameraData, user.uid);
        
        toast.success("Camera added successfully");
        
        // Call the onSubmit callback to notify parent component
        await onSubmit({
          name: formData.name,
          type: formData.type,
          url: formData.url,
          file: formData.file,
          detectionZones: zones.map((zone, index) => ({
            id: `zone-${index + 1}`,
            name: `Zone ${index + 1}`,
            points: zone.points
          }))
        });
      } catch (error) {
        console.error('Error adding camera:', error);
        toast.error('Failed to add camera');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const drawZones = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw completed zones
    zones.forEach(zone => {
      drawPolygon(ctx, zone.points, 'rgba(0, 255, 0, 0.2)');
    });

    // Draw current zone
    if (currentZone.length > 0) {
      drawPolygon(ctx, currentZone, 'rgba(0, 255, 0, 0.4)');
    }
  };

  const drawPolygon = (ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>, fillStyle: string) => {
    if (points.length < 1) return;

    // Draw the shape
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((point, index) => {
      if (index > 0) {
        ctx.lineTo(point.x, point.y);
      }
    });

    // Close the shape if we have enough points
    if (points.length > 2) {
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }

    // Draw the lines with increased width
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 4;  // Increased line width
    ctx.stroke();

    // Draw the points
    points.forEach((point, index) => {
      // Draw larger point circle with white outline
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);  // Increased radius from 6 to 8
      ctx.fillStyle = '#00ff00';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;  // Increased outline width
      ctx.stroke();

      // Draw bolder point number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';  // Increased font size and made bold
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), point.x, point.y);

      // Add extra white outline to number for better visibility
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText((index + 1).toString(), point.x, point.y);
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Add New Camera</h2>
        
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
                setFormData({ ...formData, type: value, url: '' });
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
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, file });
                    const url = URL.createObjectURL(file);
                    setVideoPreviewUrl(url);
                  }
                }}
              />
            </div>
          )}
        </div>
        
        <div className="relative">
          <div className="aspect-video bg-black/10 rounded-lg overflow-hidden relative">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              muted
              playsInline
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
              onClick={handleCanvasClick}
            />
            
            {!videoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                {formData.type === 'ip' && formData.url ? 'Loading stream...' : 'Configure camera to preview'}
              </div>
            )}
          </div>
          
          {videoLoaded && (
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={deleteAllZones}
                title="Delete all zones"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              {isDrawing && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={deleteLastPoint}
                    title="Delete last point"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleFinishZone}
                    title="Complete zone"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {!isDrawing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDrawing(true)}
                  title="Draw new zone"
                >
                  <Square className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
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
            {isSubmitting ? 'Adding...' : 'Add Device'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
