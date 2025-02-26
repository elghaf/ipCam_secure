import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Trash2, Square, CheckSquare, Undo, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { mongoService } from '@/lib/services/mongoService';

const YOLO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'bus', 'truck', 'traffic light',
  'stop sign', 'dog', 'cat', 'bird', 'backpack', 'umbrella', 'handbag'
] as const;

interface Point {
  x: number;
  y: number;
}

interface DetectionZone {
  points: Point[];
  objectTypes: string[];
  name: string;
}

interface CameraFormData {
  name: string;
  type: 'ip' | 'video' | 'webcam';
  url: string;
  file?: File;
  detectionZones: DetectionZone[];
}

interface AddCameraFormProps {
  onSubmit: (data: CameraFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  initialData?: CameraFormData;
}

export default function AddCameraForm({ onSubmit, onCancel, isEditing = false, initialData }: AddCameraFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CameraFormData>(
    initialData || {
      name: "",
      type: "ip",
      url: "",
      file: undefined,
      detectionZones: [],
    }
  );

  const [zones, setZones] = useState<DetectionZone[]>(initialData?.detectionZones || []);
  const [selectedObjectTypes, setSelectedObjectTypes] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentZone, setCurrentZone] = useState<Point[]>([]);
  const [zoneName, setZoneName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData(initialData);
      setZones(initialData.detectionZones || []);
    }
  }, [isEditing, initialData]);

  useEffect(() => {
    let mounted = true;

    const setupVideo = async () => {
      const video = videoRef.current;
      if (!video) return;

      try {
        if (formData.type === 'video' && videoPreviewUrl) {
          video.src = videoPreviewUrl;
        } else if (formData.type === 'ip' && formData.url) {
          video.src = formData.url;
        } else if (formData.type === 'webcam') {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          setWebcamStream(stream);
          video.srcObject = stream;
        }

        video.onloadedmetadata = () => {
          if (mounted) {
            setVideoLoaded(true);
            setupCanvas();
          }
        };

        video.onerror = () => {
          if (mounted) {
            toast.error('Failed to load video stream');
            setVideoLoaded(false);
          }
        };

        video.play().catch(error => {
          console.error('Error playing video:', error);
          if (mounted) {
            toast.error('Failed to play video stream');
            setVideoLoaded(false);
          }
        });
      } catch (error) {
        console.error('Video setup error:', error);
        if (mounted) {
          toast.error('Failed to setup video stream');
          setVideoLoaded(false);
        }
      }
    };

    setupVideo();

    return () => {
      mounted = false;
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [formData.type, formData.url, videoPreviewUrl]);

  useEffect(() => {
    setupCanvas();
  }, [videoLoaded, zones, currentZone]);

  const setupCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !videoLoaded) return;

    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
    drawZones();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !videoLoaded || !isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (currentZone.length === 0) {
      setCurrentZone([{ x, y }]);
    } else {
      const startPoint = currentZone[0];
      const distance = Math.sqrt(
        Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2)
      );

      if (currentZone.length >= 3 && distance < 20) {
        handleFinishZone();
      } else {
        setCurrentZone([...currentZone, { x, y }]);
      }
    }
  };

  const handleFinishZone = () => {
    if (currentZone.length < 3) {
      toast.error('Zone must have at least 3 points');
      return;
    }
    if (selectedObjectTypes.length === 0) {
      toast.error('Please select at least one object type to detect');
      return;
    }

    const newZone: DetectionZone = {
      points: [...currentZone],
      objectTypes: [...selectedObjectTypes],
      name: zoneName.trim() || `Zone ${zones.length + 1}`
    };

    const newZones = [...zones, newZone];
    setZones(newZones);
    setFormData(prev => ({ ...prev, detectionZones: newZones }));
    setCurrentZone([]);
    setZoneName('');
    setIsDrawing(false);
    toast.success(`${newZone.name} added successfully`);
  };

  const startNewZone = () => {
    if (selectedObjectTypes.length === 0) {
      toast.error('Please select objects to detect before adding a zone');
      return;
    }
    setIsDrawing(true);
    setCurrentZone([]);
    setZoneName('');
  };

  const deleteCurrentZone = () => {
    setCurrentZone([]);
    setZoneName('');
    setIsDrawing(false);
  };

  const drawZones = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    zones.forEach((zone) => {
      drawPolygon(ctx, zone.points, 'rgba(0, 255, 0, 0.2)', `${zone.name} (${zone.objectTypes.join(', ')})`);
    });

    if (currentZone.length > 0) {
      drawPolygon(ctx, currentZone, 'rgba(255, 165, 0, 0.4)', `Drawing (${currentZone.length} points)`);
    }
  };

  const drawPolygon = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    fillStyle: string,
    label?: string
  ) => {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((point, index) => {
      if (index > 0) ctx.lineTo(point.x, point.y);
    });

    if (points.length >= 3) {
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (label) {
      const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

      ctx.font = '14px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(label, centerX, centerY);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Please enter a camera name');
      return;
    }

    if (formData.type === 'ip' && !formData.url) {
      toast.error('Please enter a camera URL');
      return;
    }

    if (formData.type === 'video' && !formData.file && !isEditing) {
      toast.error('Please select a video file');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      toast.success(isEditing ? "Camera updated successfully" : "Camera added successfully");
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to save camera');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSaveButtonText = () => {
    if (isSubmitting) return 'Adding...';
    switch (formData.type) {
      case 'video': return 'Save Video';
      case 'webcam': return 'Save Webcam';
      case 'ip': return 'Save IPCam';
      default: return 'Save Camera';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Add Surveillance Camera</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Camera Name</Label>
            <Input
              placeholder="Enter camera name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Camera Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'ip' | 'video' | 'webcam') =>
                setFormData({ ...formData, type: value, url: '', file: undefined })}
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
              <Label>Camera URL</Label>
              <Input
                placeholder="rtsp:// or http:// stream URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
          )}

          {formData.type === 'video' && (
            <div className="col-span-2">
              <Label>Video File</Label>
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, file });
                    setVideoPreviewUrl(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Objects to Detect (YOLO)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
              {YOLO_CLASSES.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={selectedObjectTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      setSelectedObjectTypes(prev =>
                        checked
                          ? [...prev, type]
                          : prev.filter(t => t !== type)
                      );
                    }}
                  />
                  <label htmlFor={type} className="text-sm">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                </div>
              ))}
            </div>
            {selectedObjectTypes.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedObjectTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Draw Detection Zones</Label>
            <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-contain" muted playsInline />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
                onClick={handleCanvasClick}
              />
              {!videoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <AlertCircle className="mr-2" />
                  {formData.type === 'ip' && formData.url ? 'Loading stream...' : 'Configure camera to preview'}
                </div>
              )}
            </div>

            {videoLoaded && (
              <div className="mt-2 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={startNewZone}
                    disabled={selectedObjectTypes.length === 0}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    {selectedObjectTypes.length === 0 ? 'Select Objects First' : 'Add New Zone'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setZones([]);
                      setFormData({ ...formData, detectionZones: [] });
                      setCurrentZone([]);
                      setIsDrawing(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Clear All Zones
                  </Button>
                </div>

                {isDrawing && (
                  <div className="space-y-2 border-t pt-2">
                    <div className="flex items-center gap-2">
                      <Label>Zone Name</Label>
                      <Input
                        placeholder={`Zone ${zones.length + 1}`}
                        value={zoneName}
                        onChange={(e) => setZoneName(e.target.value)}
                        className="w-40"
                      />
                      <p className="text-sm text-muted-foreground">
                        Points: {currentZone.length} (min 3 to finish)
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentZone(currentZone.slice(0, -1))}
                        disabled={currentZone.length === 0}
                      >
                        <Undo className="h-4 w-4 mr-2" /> Undo Point
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleFinishZone}
                        disabled={currentZone.length < 3}
                      >
                        <CheckSquare className="h-4 w-4 mr-2" /> Finish Zone
                      </Button>
                      <Button size="sm" variant="outline" onClick={deleteCurrentZone}>
                        <X className="h-4 w-4 mr-2" /> Cancel Drawing
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {zones.length > 0 && (
            <div className="text-sm">
              <h3 className="font-medium mb-2">Defined Zones ({zones.length}):</h3>
              <ul className="list-disc pl-5">
                {zones.map((zone, idx) => (
                  <li key={idx}>
                    {zone.name} - Detects: {zone.objectTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {getSaveButtonText()}
          </Button>
        </div>
      </div>
    </Card>
  );
}