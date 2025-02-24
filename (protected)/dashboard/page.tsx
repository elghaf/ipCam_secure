'use client';

import { useState, useEffect } from "react";
import { useUserGuardContext } from "@/app/UserGuardContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AddCameraForm } from "@/components/AddCameraForm";
import { CameraCard } from "@/components/CameraCard";
import { DetectionConfig } from "@/components/DetectionConfig";
import { useCameraStore } from "@/lib/stores/cameraStore";
import { useDetectionStore } from "@/lib/stores/detectionStore";
import { DetectionZone } from "@/lib/types/detectionTypes";
import { DetectionEvents } from "@/components/DetectionEvents";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardPage() {
  const { user } = useUserGuardContext();
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [showDetectionConfig, setShowDetectionConfig] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [showEvents, setShowEvents] = useState(false);
  
  const { cameras, loading, error, addCamera, toggleCamera, deleteCamera, subscribeToUserCameras } = useCameraStore();
  const { configuredCameras, configureDetection } = useDetectionStore();

  useEffect(() => {
    const unsubscribe = subscribeToUserCameras(user.uid);
    return () => unsubscribe();
  }, [user.uid, subscribeToUserCameras]);

  const handleAddCamera = async (data: any) => {
    try {
      await addCamera(data, user.uid);
      setShowAddCamera(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to add camera");
    }
  };

  const handleConfigureDetection = async (zones: DetectionZone[]) => {
    if (!selectedCamera) return;
    
    try {
      await configureDetection({
        camera_id: selectedCamera,
        zones,
      });
      toast.success("Detection configured successfully");
      setShowDetectionConfig(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to configure detection");
    }
  };

  const handleDeleteCamera = async (id: string) => {
    if (confirm("Are you sure you want to delete this camera?")) {
      try {
        await deleteCamera(id);
        toast.success("Camera deleted successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete camera");
      }
    }
  };

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-4">
          <div className="text-center text-red-500">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-7xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Camera Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage your cameras and video feeds
              </p>
            </div>
            <Dialog open={showAddCamera} onOpenChange={setShowAddCamera}>
              <DialogTrigger asChild>
                <Button size="lg">
                  Add Camera
                </Button>
              </DialogTrigger>
              <DialogContent>
                <AddCameraForm
                  onSubmit={handleAddCamera}
                  onCancel={() => setShowAddCamera(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-12">
              Loading cameras...
            </div>
          ) : cameras.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No cameras added yet. Click the button above to add your first camera.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cameras.map((camera) => (
                <div key={camera.id} className="relative group">
                  <CameraCard
                    camera={camera}
                    onToggle={() => toggleCamera(camera.id)}
                    onDelete={() => handleDeleteCamera(camera.id)}
                    detectionZones={configuredCameras[camera.id]}
                  />
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedCamera(camera.id);
                        setShowDetectionConfig(true);
                      }}
                    >
                      Configure Detection
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedCamera(camera.id);
                        setShowEvents(true);
                      }}
                    >
                      View Events
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Dialog open={showDetectionConfig} onOpenChange={setShowDetectionConfig}>
            <DialogContent className="max-w-2xl">
              <DetectionConfig
                zones={configuredCameras[selectedCamera || ""] || []}
                onZonesChange={(zones) => {
                  if (!selectedCamera) return;
                  handleConfigureDetection(zones);
                }}
                onSave={() => {
                  if (!selectedCamera) return;
                  handleConfigureDetection(configuredCameras[selectedCamera]);
                }}
                onCancel={() => setShowDetectionConfig(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showEvents} onOpenChange={setShowEvents}>
            <DialogContent className="max-w-4xl">
              {selectedCamera && <DetectionEvents cameraId={selectedCamera} />}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}