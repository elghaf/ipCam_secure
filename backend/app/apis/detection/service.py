import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, storage
import tempfile
import os
from app.apis.detection.models import DetectionZone, DetectionEvent
from app.config import settings

class MotionDetector:
    def __init__(self, min_area: int = 500, blur_size: int = 21):
        self.min_area = min_area
        self.blur_size = blur_size if blur_size % 2 == 1 else blur_size + 1  # Ensure odd number
        self.background = None
        
    def detect(self, frame: np.ndarray, zones: List[DetectionZone]) -> List[Tuple[int, float]]:
        if frame is None or frame.size == 0:
            return []

        # Convert frame to grayscale and apply blur
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (self.blur_size, self.blur_size), 0)
        
        # Initialize or update background model
        if self.background is None:
            self.background = gray
            return []
            
        # Calculate frame difference and threshold
        frame_delta = cv2.absdiff(self.background, gray)
        thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)[1]
        thresh = cv2.dilate(thresh, None, iterations=2)
        
        # Update background model with current frame
        cv2.accumulateWeighted(gray, self.background, 0.5)
        
        # Process each detection zone
        height, width = frame.shape[:2]
        detections: List[Tuple[int, float]] = []
        
        for i, zone in enumerate(zones):
            # Convert normalized coordinates to pixels
            x = int(zone.x * width)
            y = int(zone.y * height)
            w = int(zone.width * width)
            h = int(zone.height * height)
            
            # Create and apply zone mask
            zone_mask = np.zeros(thresh.shape, dtype=np.uint8)
            cv2.rectangle(zone_mask, (x, y), (x + w, y + h), 255, -1)
            zone_motion = cv2.bitwise_and(thresh, thresh, mask=zone_mask)
            
            # Calculate motion percentage in zone
            zone_area = np.count_nonzero(zone_motion)
            total_area = w * h
            if total_area > 0 and zone_area > self.min_area * zone.sensitivity:
                detections.append((i, float(zone_area) / total_area))
        
        return detections

class DetectionService:
    def __init__(self):
        self.detectors: Dict[str, MotionDetector] = {}
        self.configs: Dict[str, Dict] = {}
        
        # Initialize Firebase if not already done
        if not firebase_admin._apps:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred, {
                'storageBucket': settings.FIREBASE_STORAGE_BUCKET
            })
        
        self.bucket = storage.bucket()
    
    def get_detector(self, camera_id: str) -> MotionDetector:
        if camera_id not in self.detectors:
            config = self.configs.get(camera_id, {})
            self.detectors[camera_id] = MotionDetector(
                min_area=config.get('min_area', 500),
                blur_size=config.get('blur_size', 21)
            )
        return self.detectors[camera_id]
    
    def configure_detector(self, camera_id: str, config: dict) -> None:
        self.configs[camera_id] = config
        # Reset detector to apply new configuration
        if camera_id in self.detectors:
            del self.detectors[camera_id]
    
    async def process_frame(
        self, 
        camera_id: str, 
        frame: np.ndarray, 
        zones: List[DetectionZone]
    ) -> Optional[DetectionEvent]:
        try:
            detector = self.get_detector(camera_id)
            detections = detector.detect(frame, zones)
            
            if not detections:
                return None
                
            # Get detection with largest motion area
            zone_index, motion_area = max(detections, key=lambda x: x[1])
            
            # Save snapshot and create event
            timestamp = int(datetime.now().timestamp() * 1000)
            snapshot_url = await self._save_snapshot(camera_id, frame, timestamp)
            
            return DetectionEvent(
                camera_id=camera_id,
                timestamp=timestamp,
                zone_index=zone_index,
                motion_area=motion_area,
                snapshot_url=snapshot_url
            )
        except Exception as e:
            print(f"Error processing frame: {str(e)}")
            return None
    
    async def _save_snapshot(self, camera_id: str, frame: np.ndarray, timestamp: int) -> str:
        temp_path = None
        try:
            # Save frame to temporary file
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                temp_path = temp_file.name
                cv2.imwrite(temp_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                
            # Upload to Firebase Storage
            blob_path = f'snapshots/{camera_id}/{timestamp}.jpg'
            blob = self.bucket.blob(blob_path)
            blob.upload_from_filename(temp_path)
            blob.make_public()
            
            return blob.public_url
            
        finally:
            # Clean up temporary file
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path) 