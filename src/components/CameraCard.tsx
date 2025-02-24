'use client';

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera } from "@/lib/types";
import { DetectionZone } from "@/lib/types/detectionTypes";

interface CameraCardProps {
  camera: Camera;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  detectionZones?: DetectionZone[];
  onConfigureDetection: () => void;
  onViewEvents: () => void;
}

export function CameraCard({
  camera,
  onToggle,
  onDelete,
  detectionZones,
  onConfigureDetection,
  onViewEvents
}: CameraCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted relative">
        {camera.type === "ip" && camera.enabled ? (
          <div className="relative w-full h-full">
            <Image
              src={camera.url}
              alt={camera.name}
              fill
              className="object-cover"
              unoptimized // For external URLs
            />
            {detectionZones?.map((zone, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: `${zone.x * 100}%`,
                  top: `${zone.y * 100}%`,
                  width: `${zone.width * 100}%`,
                  height: `${zone.height * 100}%`,
                  border: '2px dashed #00ff00',
                  backgroundColor: 'rgba(0, 255, 0, 0.1)',
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {camera.enabled ? "Loading..." : "Camera Disabled"}
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              camera.status === "online" 
                ? "bg-green-500" 
                : camera.status === "error" 
                ? "bg-red-500" 
                : "bg-yellow-500"
            }`}
          />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold truncate">{camera.name}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(!camera.enabled)}
          >
            {camera.enabled ? "Disable" : "Enable"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1 truncate">
          {camera.type === "ip" ? "IP Camera" : "Video File"}
        </p>
        {camera.lastError && (
          <p className="text-sm text-red-500 mt-2">{camera.lastError}</p>
        )}
        <div className="mt-4 flex justify-end space-x-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
} 
