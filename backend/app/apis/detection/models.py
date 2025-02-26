from typing import List, Optional
from pydantic import BaseModel

class DetectionZone(BaseModel):
    x: float  # Normalized coordinates (0-1)
    y: float
    width: float
    height: float
    sensitivity: float = 0.3  # Default sensitivity

class CameraConfig(BaseModel):
    camera_id: str
    enabled: bool
    zones: List[DetectionZone] = []
    min_area: int = 500  # Minimum contour area to trigger detection
    blur_size: int = 21  # Gaussian blur kernel size
    
class DetectionEvent(BaseModel):
    camera_id: str
    timestamp: int
    zone_index: int
    motion_area: float
    snapshot_url: Optional[str] = None
    
class ConfigureDetectionRequest(BaseModel):
    camera_id: str
    zones: List[DetectionZone]
    min_area: Optional[int] = None
    blur_size: Optional[int] = None
    
class ConfigureDetectionResponse(BaseModel):
    success: bool
    message: str
    
class GetDetectionEventsRequest(BaseModel):
    camera_id: str
    start_time: Optional[int] = None
    end_time: Optional[int] = None
    limit: int = 100
    
class GetDetectionEventsResponse(BaseModel):
    events: List[DetectionEvent]