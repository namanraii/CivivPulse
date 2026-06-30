import os
import firebase_admin
from firebase_admin import credentials, firestore

def get_db():
    if not firebase_admin._apps:
        # Check for env var first (Render deployment)
        cred_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        
        # Fallback to local file if not set
        if not cred_path:
            cred_path = os.path.join(os.path.dirname(__file__), 'civicpulse-caf3f-firebase-adminsdk-fbsvc-54f8ad1341.json')
            
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            'storageBucket': 'civicpulse-caf3f.firebasestorage.app'
        })
    return firestore.client()

db = get_db()
