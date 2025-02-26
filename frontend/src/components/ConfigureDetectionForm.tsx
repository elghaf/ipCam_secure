import { FC, useState, useRef, useEffect } from 'react';
import { useCameraStore } from '@/lib/stores/cameraStore';
import { DetectionZone } from '@/lib/types/detectionTypes';

interface Props {
  cameraId: string;
  onSubmit: (config: any) => Promise<void>;
  onCancel: () => void;
}

const ConfigureDetectionForm: FC<Props> = ({ cameraId, onSubmit, onCancel }) => {
  const { cameras } = useCameraStore();
  const camera = cameraId ? cameras.find(c => c.id === cameraId) : null;
  
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentZone, setCurrentZone] = useState<Array<{ x: number; y: number }>>([]);
  const [zones, setZones] = useState<DetectionZone[]>(camera?.detectionZones || []);
  
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

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoPreviewUrl || undefined}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          onLoadedMetadata={() => setVideoLoaded(true)}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onClick={handleCanvasClick}
        />
      </div>
      
      {/* Add your form controls here */}
      <div className="flex justify-end gap-2">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={() => onSubmit({ zones })}>Save</button>
      </div>
    </div>
  );
};

export default ConfigureDetectionForm;
