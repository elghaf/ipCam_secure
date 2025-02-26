'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import AddCameraForm from "@/components/AddCameraForm";
import ConfigureDetectionForm from "@/components/ConfigureDetectionForm";
import { useCameraStore } from "@/lib/stores/cameraStore";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, Trash2, Edit, Search, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type CameraFormData, type Camera } from "@/lib/types/detectionTypes";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DashboardPage() {
  const { user } = useAuth();
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [showConfigureDetection, setShowConfigureDetection] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "status" | "createdAt">("name");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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

  const handleAddCamera = useCallback(async (formData: CameraFormData) => {
    try {
      if (!user) return;
      
      const formattedData = {
        ...formData,
        detectionZones: formData.detectionZones.map((zone, index) => ({
          id: zone.id || `zone-${index}`,
          name: zone.name || `Zone ${index + 1}`,
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
  }, [user, addCamera]);

  const handleUpdateCamera = useCallback(async (formData: CameraFormData) => {
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

      await updateCamera(selectedCamera.id, updatedData);
      setShowAddCamera(false);
      setIsEditing(false);
      setSelectedCamera(null);
      toast.success('Camera updated successfully');
    } catch (error: any) {
      console.error('Error updating camera:', error);
      toast.error(error.message || 'Failed to update camera');
    }
  }, [user, selectedCamera, updateCamera]);

  const handleEditCamera = useCallback((cameraId: string) => {
    const camera = cameras.find(c => c.id === cameraId);
    if (camera) {
      console.log("Editing camera:", camera); 
      setSelectedCamera(camera);
      setSelectedCameraId(cameraId);
      setIsEditing(true);
      setShowAddCamera(true);
    }
  }, [cameras]);

  const handleDeleteCamera = useCallback(async (id: string) => {
    try {
      await deleteCamera(id);
      setShowDeleteConfirm(null);
      toast.success('Camera deleted successfully');
    } catch (error: any) {
      console.error('Error deleting camera:', error);
      toast.error(error.message || 'Failed to delete camera');
    }
  }, [deleteCamera]);

  const handleToggleCamera = useCallback(async (id: string) => {
    try {
      await toggleCamera(id);
      toast.success('Camera status updated');
    } catch (error: any) {
      console.error('Error toggling camera:', error);
      toast.error(error.message || 'Failed to toggle camera');
    }
  }, [toggleCamera]);

  const handleSaveDetectionConfig = useCallback(async (config: any) => {
    try {
      if (!selectedCameraId) return;
      await configureDetection(selectedCameraId, config);
      setShowConfigureDetection(false);
      toast.success('Detection configuration saved');
    } catch (error: any) {
      console.error('Error saving detection config:', error);
      toast.error(error.message || 'Failed to save detection configuration');
    }
  }, [selectedCameraId, configureDetection]);

  const filteredCameras = useMemo(() => {
    return cameras
      .filter(camera => 
        camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camera.url?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'status') return (a.enabled ? -1 : 1) - (b.enabled ? -1 : 1);
        if (sortBy === 'createdAt') return (b.createdAt || 0) - (a.createdAt || 0);
        return 0;
      });
  }, [cameras, searchQuery, sortBy]);

  if (error) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-4">
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-500 space-y-2">
              <p className="text-lg font-semibold">Error loading cameras</p>
              <p className="text-sm">{error}</p>
              <Button variant="outline" onClick={() => user && loadCameras(user.uid)}>
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Camera Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage your cameras and video feeds ({filteredCameras.length} devices)
              </p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cameras..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full md:w-64"
                />
              </div>
              <Dialog open={showAddCamera} onOpenChange={setShowAddCamera}>
                <DialogTrigger asChild>
                  <Button size="lg">Add Device</Button>
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
                    initialData={selectedCamera && isEditing ? {
                      name: selectedCamera.name || '',
                      type: selectedCamera.type as 'ip' | 'video' | 'webcam',
                      url: selectedCamera.url || '',
                      file: undefined, // File isn't stored in DB, so it's undefined for edit
                      detectionZones: selectedCamera.detectionZones?.map(zone => ({
                        points: zone.points || [],
                        name: zone.name || `Zone ${cameras.indexOf(zone) + 1}`,
                        // Assuming AddCameraForm doesn't need `id` in detectionZones
                      })) || [],
                    } : undefined}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading cameras...</span>
              </div>
            </div>
          ) : filteredCameras.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? 'No cameras match your search.' : 'No devices added yet. Click "Add Device" to start.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredCameras.length} of {cameras.length} cameras
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Sort by: {sortBy === 'name' ? 'Name' : sortBy === 'status' ? 'Status' : 'Created At'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSortBy('name')}>Name</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('status')}>Status</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('createdAt')}>Created At</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

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

              <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
                <DialogContent>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this camera? This action cannot be undone.
                  </DialogDescription>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={() => showDeleteConfirm && handleDeleteCamera(showDeleteConfirm)}>
                      Delete
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCameras.map((camera) => (
                    <Card key={camera.id} className="group hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="truncate">{camera.name}</CardTitle>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            onClick={() => setShowDeleteConfirm(camera.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                          {camera.type === 'ip' && camera.url && (
                            <video
                              src={camera.url}
                              className="w-full h-full object-cover"
                              autoPlay
                              muted
                              playsInline
                              onError={() => toast.error(`Failed to load video for ${camera.name}`)}
                            />
                          )}
                          <Badge 
                            className="absolute top-2 right-2"
                            variant={camera.enabled ? "default" : "destructive"}
                          >
                            {camera.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Type:</span> {camera.type}</p>
                          {camera.url && (
                            <p className="truncate"><span className="font-medium">URL:</span> {camera.url}</p>
                          )}
                          {camera.createdAt && (
                            <p><span className="font-medium">Added:</span> {new Date(camera.createdAt).toLocaleDateString()}</p>
                          )}
                        </div>

                        {camera.detectionZones?.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Zones:</p>
                            <p className="text-sm text-muted-foreground">{camera.detectionZones.length} configured</p>
                          </div>
                        )}

                        {camera.configuration && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Detection:</p>
                            <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                              <span>Sensitivity: {camera.configuration.sensitivity}</span>
                              <span>Min: {camera.configuration.minObjectSize}px</span>
                              <span>Max: {camera.configuration.maxObjectSize}px</span>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleToggleCamera(camera.id)}
                          >
                            {camera.enabled ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedCameraId(camera.id);
                              setShowConfigureDetection(true);
                            }}
                          >
                            Configure
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </div>
    </div>
  );
}