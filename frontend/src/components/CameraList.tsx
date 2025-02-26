import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit } from 'lucide-react';
import EditCameraForm from './EditCameraForm';

export default function CameraList({ cameras }) {
  const [editingCamera, setEditingCamera] = useState<CameraData | null>(null);

  const handleEditSubmit = async (updatedCamera: CameraData) => {
    // Handle the camera update
    try {
      // Update the cameras list or trigger a refresh
      setEditingCamera(null); // Close the edit form
    } catch (error) {
      console.error('Error updating camera:', error);
    }
  };

  if (editingCamera) {
    return (
      <EditCameraForm
        camera={editingCamera}
        onSubmit={handleEditSubmit}
        onCancel={() => setEditingCamera(null)}
      />
    );
  }

  return (
    <div className="grid gap-4">
      {cameras.map((camera) => (
        <div key={camera._id} className="flex items-center justify-between p-4 border rounded">
          <div>
            <h3>{camera.name}</h3>
            <p className="text-sm text-gray-500">{camera.type}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingCamera(camera)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
} 