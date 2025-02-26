from pymongo import MongoClient
from pymongo.server_api import ServerApi
from bson.objectid import ObjectId
from datetime import datetime
import os
from typing import Dict, List, Any, Optional

class MongoDBService:
    def __init__(self):
        uri = os.getenv("MONGODB_URI")
        db_name = os.getenv("MONGODB_DATABASE")
        
        # Create a new client and connect to the server
        self.client = MongoClient(uri, server_api=ServerApi('1'))
        self.db = self.client[db_name]
        
        # Collections
        self.cameras = self.db["cameras"]
        self.detection_events = self.db["detection_events"]
        self.detection_zones = self.db["detection_zones"]
        self.device_info = self.db["device_info"]
        self.app_state = self.db["app_state"]
        
    def test_connection(self):
        """Test the MongoDB connection"""
        try:
            self.client.admin.command('ping')
            return True
        except Exception as e:
            print(f"MongoDB connection error: {e}")
            return False
    
    # Camera operations
    def get_cameras(self, user_id: str) -> List[Dict]:
        """Get all cameras for a user"""
        return list(self.cameras.find({"userId": user_id}))
    
    def add_camera(self, camera_data: Dict) -> str:
        """Add a new camera"""
        camera_data["createdAt"] = datetime.now()
        result = self.cameras.insert_one(camera_data)
        return str(result.inserted_id)
    
    def update_camera(self, camera_id: str, update_data: Dict) -> bool:
        """Update camera information"""
        result = self.cameras.update_one(
            {"_id": ObjectId(camera_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    def delete_camera(self, camera_id: str) -> bool:
        """Delete a camera"""
        result = self.cameras.delete_one({"_id": ObjectId(camera_id)})
        return result.deleted_count > 0
    
    # Detection events operations
    def add_detection_event(self, event_data: Dict) -> str:
        """Add a new detection event"""
        event_data["timestamp"] = datetime.now()
        result = self.detection_events.insert_one(event_data)
        return str(result.inserted_id)
    
    def get_detection_events(self, camera_id: str, start_time: datetime, end_time: datetime) -> List[Dict]:
        """Get detection events for a camera within a time range"""
        return list(self.detection_events.find({
            "cameraId": camera_id,
            "timestamp": {
                "$gte": start_time,
                "$lte": end_time
            }
        }).sort("timestamp", -1))
    
    # Detection zones operations
    def configure_zones(self, camera_id: str, zones: List[Dict]) -> bool:
        """Configure detection zones for a camera"""
        result = self.detection_zones.update_one(
            {"cameraId": camera_id},
            {"$set": {"zones": zones}},
            upsert=True
        )
        return result.modified_count > 0 or result.upserted_id is not None
    
    def get_zones(self, camera_id: str) -> List[Dict]:
        """Get detection zones for a camera"""
        zones_doc = self.detection_zones.find_one({"cameraId": camera_id})
        return zones_doc.get("zones", []) if zones_doc else []
    
    # Device information operations
    def register_device(self, device_info: Dict) -> str:
        """Register a new device or update existing device info"""
        device_id = device_info.get("deviceId")
        if device_id:
            result = self.device_info.update_one(
                {"deviceId": device_id},
                {"$set": {**device_info, "lastSeen": datetime.now()}},
                upsert=True
            )
            return device_id
        else:
            device_info["registeredAt"] = datetime.now()
            device_info["lastSeen"] = datetime.now()
            result = self.device_info.insert_one(device_info)
            return str(result.inserted_id)
    
    def update_device_status(self, device_id: str, status: Dict) -> bool:
        """Update device status"""
        result = self.device_info.update_one(
            {"deviceId": device_id},
            {"$set": {
                "status": status,
                "lastSeen": datetime.now()
            }}
        )
        return result.modified_count > 0
    
    def get_device_info(self, device_id: str) -> Optional[Dict]:
        """Get device information"""
        return self.device_info.find_one({"deviceId": device_id})
    
    # Application state operations
    def save_app_state(self, user_id: str, state_data: Dict) -> bool:
        """Save application state for a user"""
        result = self.app_state.update_one(
            {"userId": user_id},
            {"$set": {
                "state": state_data,
                "updatedAt": datetime.now()
            }},
            upsert=True
        )
        return result.modified_count > 0 or result.upserted_id is not None
    
    def get_app_state(self, user_id: str) -> Optional[Dict]:
        """Get application state for a user"""
        state_doc = self.app_state.find_one({"userId": user_id})
        return state_doc.get("state", {}) if state_doc else None
    
    def close(self):
        """Close the MongoDB connection"""
        self.client.close()