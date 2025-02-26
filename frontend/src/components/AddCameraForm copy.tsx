import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Trash2, Square, CheckSquare, Undo } from 'lucide-react';

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
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentZone, setCurrentZone] = useState<Array<{ x: number; y: number }>>([]);
  const [zones, setZones] = useState<Array<{ points: Array<{ x: number; y: number }> }>>([]);
  
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
    return true;
  };

  const handleSubmit = async () => {
    if (validateCameraSettings()) {
      try {
        // Clean up any active streams
        if (webcamStream) {
          webcamStream.getTracks().forEach(track => track.stop());
        }
        
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
        toast.error('Failed to add camera');
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
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Camera Configuration</h3>
        
        <Input
          placeholder="Camera Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        
        <Select
          value={formData.type}
          onValueChange={(value: 'ip' | 'video' | 'webcam') => 
            setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select camera type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ip">IP Camera</SelectItem>
            <SelectItem value="video">Video File</SelectItem>
            <SelectItem value="webcam">Webcam</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full object-contain"
            autoPlay
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full cursor-crosshair"
            onClick={handleCanvasClick}
          />
          
          {videoLoaded && (
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20 pointer-events-auto">
              <div className="bg-black/70 p-2 rounded flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAllZones();
                  }}
                  title="Delete all zones"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {isDrawing && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLastPoint();
                      }}
                      title="Undo last point"
                    >
                      <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetCurrentZone();
                      }}
                      title="Cancel current zone"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFinishZone();
                      }}
                      disabled={currentZone.length < 3}
                      title="Complete zone"
                    >
                      <CheckSquare className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {videoLoaded && (
            <div className="absolute bottom-4 left-4 bg-black/70 text-white p-2 rounded z-20">
              <div className="text-sm">
                {!isDrawing ? (
                  "Click anywhere to start drawing a detection zone"
                ) : (
                  <div className="space-y-1">
                    <p>Points: {currentZone.length} (minimum 3)</p>
                    <p className="text-xs opacity-75">
                      Click to add points. Use controls to finish or reset.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!videoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center text-white z-20">
              Please select a video source and provide required information
            </div>
          )}
        </div>

        {formData.type === 'video' && (
          <Input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setVideoPreviewUrl(URL.createObjectURL(file));
                setFormData({ ...formData, file });
              }
            }}
          />
        )}

        {formData.type === 'ip' && (
          <Input
            placeholder="RTSP/HTTP URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
        )}

        {zones.length > 0 && (
          <div className="bg-gray-100 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Detection Zones: {zones.length}
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={deleteAllZones}
                className="h-7"
              >
                Clear All Zones
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            className="flex-1"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1"
            onClick={handleSubmit}
          >
            Add Device
          </Button>
        </div>
      </div>
    </Card>
  );
}
