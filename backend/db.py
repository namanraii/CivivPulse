import os
import firebase_admin
from firebase_admin import credentials, firestore

def get_db():
    if not firebase_admin._apps:
        # Get path to the exact service account key
        cred_path = os.path.join(os.path.dirname(__file__), 'civicpulse-caf3f-firebase-adminsdk-fbsvc-54f8ad1341.json')
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            'storageBucket': 'civicpulse-caf3f.firebasestorage.app'
        })
    return firestore.client()

db = get_db()
