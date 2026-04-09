import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from dotenv import load_dotenv

load_dotenv()

def initialize_firebase():
    if not firebase_admin._apps:
        # Priority 1: FIREBASE_CONFIG_JSON env var (raw JSON string)
        config_json = os.getenv("FIREBASE_CONFIG_JSON")
        if config_json:
            try:
                cred_dict = json.loads(config_json)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
            except Exception as e:
                print(f"Error initializing Firebase with JSON string: {e}")
        
        # Priority 2: FIREBASE_SERVICE_ACCOUNT env var (path to file)
        elif os.getenv("FIREBASE_SERVICE_ACCOUNT"):
            try:
                cred = credentials.Certificate(os.getenv("FIREBASE_SERVICE_ACCOUNT"))
                firebase_admin.initialize_app(cred)
            except Exception as e:
                print(f"Error initializing Firebase with service account file: {e}")
        
        # Priority 3: Default application credentials or Mocking for local dev if needed
        else:
            try:
                # This might fail if no credentials are found, but we can catch it
                firebase_admin.initialize_app()
            except Exception as e:
                print(f"Firebase initialization failed: {e}. Ensure FIREBASE_SERVICE_ACCOUNT or FIREBASE_CONFIG_JSON is set.")

    return firestore.client()

db = initialize_firebase()

def get_db():
    return db
