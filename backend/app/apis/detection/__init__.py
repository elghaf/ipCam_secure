from fastapi import APIRouter, HTTPException
from app.apis.detection.models import (
    DetectionZone,
    DetectionEvent
)

router = APIRouter()

@router.get("/zones/{camera_id}")
async def get_detection_zones(camera_id: str):
    # Implementation here
    pass

@router.post("/zones")
async def create_detection_zone(zone: DetectionZone):
    # Implementation here
    pass