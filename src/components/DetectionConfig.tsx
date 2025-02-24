'use client';

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DetectionZone } from "@/lib/types/detectionTypes";

interface Props {
  zones: DetectionZone[];
  onZonesChange: (zones: DetectionZone[]) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function DetectionConfig({ zones, onZonesChange, onSave, onCancel }: Props) {
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  const handleAddZone = () => {
    const newZone: DetectionZone = {
      x: 0.1,
      y: 0.1,
      width: 0.2,
      height: 0.2,
      sensitivity: 0.3,
    };
    onZonesChange([...zones, newZone]);
    setSelectedZone(zones.length);
  };

  const handleUpdateZone = (index: number, updates: Partial<DetectionZone>) => {
    const updatedZones = zones.map((zone, i) =>
      i === index ? { ...zone, ...updates } : zone
    );
    onZonesChange(updatedZones);
  };

  const handleDeleteZone = (index: number) => {
    onZonesChange(zones.filter((_, i) => i !== index));
    setSelectedZone(null);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Detection Zones</h3>
          <Button onClick={handleAddZone}>Add Zone</Button>
        </div>

        <div className="space-y-4">
          {zones.map((zone, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg ${
                selectedZone === index ? 'border-primary' : 'border-muted'
              }`}
              onClick={() => setSelectedZone(index)}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Zone {index + 1}</h4>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteZone(index);
                  }}
                >
                  Delete
                </Button>
              </div>

              {selectedZone === index && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm">X Position</label>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={zone.x}
                        onChange={(e) =>
                          handleUpdateZone(index, { x: parseFloat(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">Y Position</label>
                      <Input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={zone.y}
                        onChange={(e) =>
                          handleUpdateZone(index, { y: parseFloat(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">Width</label>
                      <Input
                        type="number"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={zone.width}
                        onChange={(e) =>
                          handleUpdateZone(index, {
                            width: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">Height</label>
                      <Input
                        type="number"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={zone.height}
                        onChange={(e) =>
                          handleUpdateZone(index, {
                            height: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm">Sensitivity</label>
                    <Slider
                      value={[zone.sensitivity]}
                      min={0.1}
                      max={1}
                      step={0.1}
                      onValueChange={([value]) =>
                        handleUpdateZone(index, { sensitivity: value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave}>Save Configuration</Button>
      </div>
    </Card>
  );
} 