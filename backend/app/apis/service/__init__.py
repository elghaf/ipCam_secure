import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import APIRouter, HTTPException
from app.apis.detection.models import DetectionZone, DetectionEvent

router = APIRouter()

# Initialize Firebase Admin
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

@router.get("/status")
async def get_service_status():
    return {"status": "running"}