'use client';

import { useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDetectionStore } from "@/lib/stores/detectionStore";
import { DetectionEvent } from "@/lib/types/detectionTypes";

interface Props {
  cameraId: string;
}

export function DetectionEvents({ cameraId }: Props) {
  const { events, loading, error, getEvents } = useDetectionStore();

  useEffect(() => {
    // Get events from the last 24 hours
    const endTime = Date.now();
    const startTime = endTime - 24 * 60 * 60 * 1000;
    getEvents(cameraId, startTime, endTime);
  }, [cameraId, getEvents]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-red-500">Error loading events: {error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Detection Events</h3>
      {loading ? (
        <p className="text-center py-4">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-center py-4 text-muted-foreground">
          No detection events in the last 24 hours
        </p>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {events.map((event, index) => (
              <div
                key={`${event.camera_id}-${event.timestamp}-${index}`}
                className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {event.snapshot_url && (
                  <div className="relative w-32 h-24">
                    <Image
                      src={event.snapshot_url}
                      alt={`Detection event at ${formatTime(event.timestamp)}`}
                      fill
                      className="object-cover rounded-md"
                      unoptimized // For external URLs
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    Motion detected in Zone {event.zone_index + 1}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(event.timestamp)}
                  </p>
                  <p className="text-sm">
                    Motion area: {Math.round(event.motion_area * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
} 