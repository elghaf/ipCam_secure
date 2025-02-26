import { FC, useState, useRef, useEffect } from 'react';
import { useCameraStore } from '@/lib/stores/cameraStore';
import { DetectionZone } from '@/lib/types/detectionTypes';
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface DetectionType {
  id: string;
  name: string;
  enabled: boolean;
  sensitivity: number;
}

interface EnhancedDetectionZone extends DetectionZone {
  detectionTypes: DetectionType[];
  name: string;
}

interface Props {
  cameraId: string;
  onSubmit: (config: any) => Promise<void>;
  onCancel: () => void;
}

const DEFAULT_DETECTION_TYPES: DetectionType[] = [
  { id: 'person', name: 'Person Detection', enabled: false, sensitivity: 50 },
  { id: 'fire', name: 'Fire Detection', enabled: false, sensitivity: 50 },
];

const ConfigureDetectionForm: FC<Props> = ({ cameraId, onSubmit, onCancel }) => {
  const { cameras } = useCameraStore();
  const camera = cameraId ? cameras.find(c => c.id === cameraId) : null;
  
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentZone, setCurrentZone] = useState<Array<{ x: number; y: number }>>([]);
  const [zones, setZones] = useState<EnhancedDetectionZone[]>(
    (camera?.detectionZones || []).map((zone, index) => ({
      ...zone,
      name: `Zone ${index + 1}`,
      detectionTypes: [...DEFAULT_DETECTION_TYPES],
    }))
  );
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number>(-1);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  console.log("ConfigureDetectionForm initialized with camera:", camera);
  console.log("Initial zones:", zones);
  
  // Rest of the component...

  // Make sure to update the useEffect that handles drawing zones
  useEffect(() => {
    if (!videoLoaded) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    const updateCanvasSize = () => {
      if (canvas && video) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw zones immediately after setting canvas size
        drawZones();
      }
    };
    
    // Draw zones function
    const drawZones = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw completed zones
      zones.forEach(zone => {
        if (zone.points && zone.points.length > 0) {
          drawPolygon(ctx, zone.points, 'rgba(0, 255, 0, 0.2)');
        }
      });
      
      // Draw current zone
      if (currentZone.length > 0) {
        drawPolygon(ctx, currentZone, 'rgba(0, 255, 0, 0.4)');
      }
    };
    
    // Draw polygon helper function
    const drawPolygon = (ctx: CanvasRenderingContext2D, points: Array<{x: number, y: number}>, fillStyle: string) => {
      if (points.length < 1) return;
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((point, index) => {
        if (index > 0) ctx.lineTo(point.x, point.y);
      });
      
      // Close the polygon if it has at least 3 points
      if (points.length >= 3) {
        ctx.closePath();
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      
      // Draw the lines
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw the points
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        ctx.stroke();
      });
    };
    
    video.addEventListener('loadedmetadata', updateCanvasSize);
    
    // Initial update
    if (video.readyState >= 2) {
      updateCanvasSize();
    }
    
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

  const handleZoneComplete = () => {
    if (currentZone.length >= 3) {
      setZones([
        ...zones,
        {
          points: [...currentZone],
          name: `Zone ${zones.length + 1}`,
          detectionTypes: [...DEFAULT_DETECTION_TYPES],
        },
      ]);
      setCurrentZone([]);
      setIsDrawing(false);
    }
  };

  const updateZoneDetection = (zoneIndex: number, typeId: string, enabled: boolean) => {
    setZones(zones.map((zone, index) => {
      if (index === zoneIndex) {
        return {
          ...zone,
          detectionTypes: zone.detectionTypes.map(type => 
            type.id === typeId ? { ...type, enabled } : type
          ),
        };
      }
      return zone;
    }));
  };

  const updateZoneSensitivity = (zoneIndex: number, typeId: string, sensitivity: number) => {
    setZones(zones.map((zone, index) => {
      if (index === zoneIndex) {
        return {
          ...zone,
          detectionTypes: zone.detectionTypes.map(type => 
            type.id === typeId ? { ...type, sensitivity } : type
          ),
        };
      }
      return zone;
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>

      <div className="flex gap-4">
        <Button
          onClick={() => setIsDrawing(!isDrawing)}
          variant={isDrawing ? "destructive" : "default"}
        >
          {isDrawing ? "Cancel Drawing" : "Draw New Zone"}
        </Button>
        {isDrawing && currentZone.length >= 3 && (
          <Button onClick={handleZoneComplete}>
            Complete Zone
          </Button>
        )}
      </div>

      <div className="grid gap-4 mt-4">
        {zones.map((zone, zoneIndex) => (
          <Card key={zoneIndex} className="p-4">
            <h3 className="text-lg font-semibold mb-2">{zone.name}</h3>
            <div className="space-y-4">
              {zone.detectionTypes.map((type) => (
                <div key={type.id} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${zone.name}-${type.id}`}
                      checked={type.enabled}
                      onCheckedChange={(checked) => 
                        updateZoneDetection(zoneIndex, type.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`${zone.name}-${type.id}`}>
                      {type.name}
                    </Label>
                  </div>
                  {type.enabled && (
                    <div className="flex items-center gap-4">
                      <Label>Sensitivity:</Label>
                      <Slider
                        value={[type.sensitivity]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={([value]) => 
                          updateZoneSensitivity(zoneIndex, type.id, value)
                        }
                      />
                      <span className="w-12 text-right">{type.sensitivity}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-4 mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit({ zones })}>
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export default ConfigureDetectionForm;
