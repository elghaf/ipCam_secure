'use client';

import { useState, useEffect } from "react";
import { useUserGuardContext } from "@/app/UserGuardContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AddCameraForm from "@/components/AddCameraForm";
import { useCameraStore } from "@/lib/stores/cameraStore";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type CameraFormData } from "@/lib/types/detectionTypes";
import ConfigureDetectionForm from "@/components/ConfigureDetectionForm";
import { useAuth } from '@/lib/hooks/useAuth';
import { Camera } from '@/lib/types';



export default function DashboardPage() {
  const { user } = useAuth();
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [showConfigureDetection, setShowConfigureDetection] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  
  const { 
    cameras, 
    loading, 
    error, 
    addCamera, 
    loadCameras,
    deleteCamera,
    toggleCamera,
    configureDetection,
    updateCamera
  } = useCameraStore();

  useEffect(() => {
    if (user) {
      loadCameras(user.uid);
    }
  }, [user, loadCameras]);

  const handleAddCamera = async (formData: CameraFormData) => {
    try {
      if (!user) return;
      
      // Ensure detectionZones have required properties
      const formattedData = {
        ...formData,
        detectionZones: formData.detectionZones.map((zone, index) => ({
          id: `zone-${index}`, // Generate an ID if not present
          name: `Zone ${index + 1}`, // Generate a name if not present
          points: zone.points
        }))
      };

      await addCamera(formattedData, user.uid);
      setShowAddCamera(false);
      setIsEditing(false);
      setSelectedCamera(null);
      toast.success('Camera added successfully');
    } catch (error: any) {
      console.error('Error adding camera:', error);
      toast.error(error.message || 'Failed to add camera');
    }
  };

  const handleUpdateCamera = async (formData: CameraFormData) => {
    try {
      if (!user || !selectedCamera) return;
      
      const updatedData: Partial<Camera> = {
        name: formData.name,
        type: formData.type,
        url: formData.url || '',
        detectionZones: formData.detectionZones.map((zone, index) => ({
          id: zone.id || `zone-${index}`,
          name: zone.name || `Zone ${index + 1}`,
          points: zone.points
        })),
        configuration: formData.configuration || selectedCamera.configuration
      };

      console.log(`Updating camera ${selectedCamera.id} with data:`, updatedData);
      
      await updateCamera(selectedCamera.id, updatedData);
      setShowAddCamera(false);
      setIsEditing(false);
      setSelectedCamera(null);
      toast.success('Camera updated successfully');
    } catch (error: any) {
      console.error('Error updating camera:', error);
      toast.error(error.message || 'Failed to update camera');
    }
  };

  const handleEditCamera = (cameraId: string) => {
    const camera = cameras.find(c => c.id === cameraId);
    if (camera) {
      console.log("Selected camera for editing:", camera);
      console.log("Detection zones:", camera.detectionZones);
      
      setSelectedCamera(camera);
      setSelectedCameraId(cameraId);
      setIsEditing(true);
      setShowAddCamera(true);
    }
  };

  const handleDeleteCamera = async (id: string) => {
    try {
      await deleteCamera(id);
      toast.success('Camera deleted successfully');
    } catch (error: any) {
      console.error('Error deleting camera:', error);
      toast.error(error.message || 'Failed to delete camera');
    }
  };

  const handleToggleCamera = async (id: string) => {
    try {
      await toggleCamera(id);
      toast.success('Camera status updated successfully');
    } catch (error: any) {
      console.error('Error toggling camera:', error);
      toast.error(error.message || 'Failed to toggle camera');
    }
  };

  const handleSaveDetectionConfig = async (config: any) => {
    try {
      if (!selectedCameraId) return;
      await configureDetection(selectedCameraId, config);
      setShowConfigureDetection(false);
      toast.success('Detection configuration saved');
    } catch (error: any) {
      console.error('Error saving detection config:', error);
      toast.error(error.message || 'Failed to save detection configuration');
    }
  };

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-500 space-y-2">
              <p className="text-lg font-semibold">Error loading cameras</p>
              <p className="text-sm">{error}</p>
              <Button 
                variant="outline"
                onClick={() => user && loadCameras(user.uid)}
              >
                Retry
              </Button>
            </div>
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
                  Add Device
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogTitle>{isEditing ? 'Edit Camera' : 'Add New Camera'}</DialogTitle>
                <AddCameraForm
                  onSubmit={isEditing ? handleUpdateCamera : handleAddCamera}
                  onCancel={() => {
                    setShowAddCamera(false);
                    setIsEditing(false);
                    setSelectedCamera(null);
                  }}
                  isEditing={isEditing}
                  initialData={selectedCamera ? {
                    name: selectedCamera.name,
                    type: selectedCamera.type as 'ip' | 'video' | 'webcam',
                    url: selectedCamera.url,
                    detectionZones: selectedCamera.detectionZones.map(zone => ({
                      id: zone.id,
                      name: zone.name,
                      points: zone.points
                    })),
                    configuration: selectedCamera.configuration || {
                      sensitivity: 0.5,
                      minObjectSize: 30,
                      maxObjectSize: 300
                    }
                  } : undefined}
                />
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading cameras...</span>
              </div>
            </div>
          ) : cameras.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No devices added yet. Click the button above to add your first device.
              </p>
            </div>
          ) : (
            <>
              <Dialog open={showConfigureDetection} onOpenChange={setShowConfigureDetection}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogTitle>Configure Detection</DialogTitle>
                  {selectedCameraId && (
                    <ConfigureDetectionForm
                      cameraId={selectedCameraId}
                      onSubmit={handleSaveDetectionConfig}
                      onCancel={() => setShowConfigureDetection(false)}
                    />
                  )}
                </DialogContent>
              </Dialog>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cameras.map((camera) => (
                  <Card key={camera.id} className="relative group">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        {camera.name}
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditCamera(camera.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCamera(camera.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Video Preview */}
                        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                          {camera.type === 'ip' && camera.url && (
                            <video
                              src={camera.url}
                              className="w-full h-full object-cover"
                              autoPlay
                              muted
                              playsInline
                            />
                          )}
                        </div>
                        
                        {/* Camera Info */}
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Type:</span> {camera.type}
                          </p>
                          {camera.url && (
                            <p className="text-sm truncate">
                              <span className="font-medium">URL:</span> {camera.url}
                            </p>
                          )}
                          <p className="text-sm">
                            <span className="font-medium">Status:</span>{' '}
                            <span className={camera.enabled ? 'text-green-500' : 'text-red-500'}>
                              {camera.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </p>
                        </div>

                        {/* Detection Zones */}
                        {camera.detectionZones?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Detection Zones</p>
                            <div className="text-sm text-muted-foreground">
                              {camera.detectionZones.length} zones configured
                            </div>
                          </div>
                        )}

                        {/* Configuration */}
                        {camera.configuration && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Detection Settings</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>Sensitivity: {camera.configuration.sensitivity}</div>
                              <div>Min Size: {camera.configuration.minObjectSize}px</div>
                              <div>Max Size: {camera.configuration.maxObjectSize}px</div>
                            </div>
                          </div>
                        )}

                        {/* Controls */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleToggleCamera(camera.id)}
                          >
                            {camera.enabled ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

