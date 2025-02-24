'use client';

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CameraFormData } from "@/lib/types";
import { useCameraStore } from "@/lib/stores/cameraStore";

interface Props {
  onSubmit: (data: CameraFormData) => Promise<void>;
  onCancel: () => void;
}

export function AddCameraForm({ onSubmit, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const uploadProgress = useCameraStore((state) => state.uploadProgress);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<CameraFormData>({
    name: "",
    type: "ip",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || (!formData.url && !formData.file)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      await onSubmit(formData);
      toast.success("Camera added successfully");
      onCancel();
    } catch (error: any) {
      toast.error(error.message || "Failed to add camera");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Camera Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Living Room Camera"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <Select
            value={formData.type}
            onValueChange={(value: 'ip' | 'video') => 
              setFormData({ ...formData, type: value, url: "", file: undefined })
            }
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ip">IP Camera</SelectItem>
              <SelectItem value="video">Video File</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.type === "video" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Video File</label>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="video/*"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, file, url: undefined });
                  }
                }}
                disabled={loading}
              />
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Progress value={uploadProgress} className="w-full" />
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Camera URL
            </label>
            <Input
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="rtsp://example.com/stream"
              required
              disabled={loading}
            />
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Camera"}
          </Button>
        </div>
      </form>
    </Card>
  );
} 