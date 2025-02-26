from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta

from app.apis.detection.models import (
    ConfigureDetectionRequest,
    ConfigureDetectionResponse,
    GetDetectionEventsRequest,
    GetDetectionEventsResponse,
    DetectionEvent
)
from app.apis.detection.service import DetectionService

router = APIRouter(prefix="/detection")
service = DetectionService()

@router.post("/configure", response_model=ConfigureDetectionResponse)
async def configure_detection(request: ConfigureDetectionRequest) -> ConfigureDetectionResponse:
    """
    Configure detection settings for a specific camera
    """
    try:
        config = {
            'camera_id': request.camera_id,
            'zones': request.zones,
            'min_area': request.min_area or 0.1,  # Default value
            'blur_size': request.blur_size or 5,  # Default value
        }
        await service.configure_detector(config)
        
        return ConfigureDetectionResponse(
            success=True,
            message="Detection configured successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to configure detection: {str(e)}"
        )

@router.get("/events", response_model=GetDetectionEventsResponse)
async def get_detection_events(
    camera_id: str,
    start_time: Optional[int] = None,
    end_time: Optional[int] = None,
    limit: int = 100
) -> GetDetectionEventsResponse:
    """
    Get detection events for a specific camera within a time range
    """
    try:
        # Set default time range to last 24 hours if not specified
        if not end_time:
            end_time = int(datetime.now().timestamp() * 1000)
        if not start_time:
            start_time = end_time - (24 * 60 * 60 * 1000)  # 24 hours in milliseconds

        events = await service.get_events(
            camera_id=camera_id,
            start_time=start_time,
            end_time=end_time,
            limit=limit
        )
        
        return GetDetectionEventsResponse(events=events)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch detection events: {str(e)}"
        )

@router.delete("/zones/{zone_id}")
async def delete_detection_zone(zone_id: str) -> dict:
    """
    Delete a specific detection zone
    """
    try:
        await service.delete_zone(zone_id)
        return {"success": True, "message": "Zone deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete zone: {str(e)}"
        )

@router.post("/test/{camera_id}")
async def test_detection(camera_id: str) -> dict:
    """
    Test detection configuration for a specific camera
    """
    try:
        result = await service.test_detection(camera_id)
        return {
            "success": True,
            "message": "Detection test completed successfully",
            "result": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Detection test failed: {str(e)}"
        ) 