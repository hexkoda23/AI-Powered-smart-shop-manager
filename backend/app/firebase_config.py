import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from dotenv import load_dotenv

load_dotenv()

def initialize_firebase():
    if not firebase_admin._apps:
        config_json = os.getenv("FIREBASE_CONFIG_JSON")
        if config_json:
            try:
                cred_dict = json.loads(config_json)
                if "private_key" in cred_dict:
                    cred_dict["private_key"] = cred_dict["private_key"].replace("\\n", "\n")
                
                project_id = cred_dict.get("project_id")
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print(f"Firebase initialized for project: {project_id}")
            except Exception as e:
                print(f"ERROR initializing Firebase from JSON string: {e}")
                raise
        elif os.getenv("FIREBASE_SERVICE_ACCOUNT"):
            try:
                cred = credentials.Certificate(os.getenv("FIREBASE_SERVICE_ACCOUNT"))
                firebase_admin.initialize_app(cred)
                print("Firebase initialized from service account file.")
            except Exception as e:
                print(f"ERROR initializing Firebase from file: {e}")
                raise
        else:
            raise RuntimeError("FIREBASE_CONFIG_JSON or FIREBASE_SERVICE_ACCOUNT not set.")

    # Explicitly return client for (default) database
    client = firestore.client()
    
    # Simple connectivity test
    try:
        # Just check if we can list collections (even if empty)
        collections = client.collections()
        print("Firestore connectivity verified successfully.")
    except Exception as e:
        print(f"Firestore Connectivity Check Failed: {e}")
        # We don't raise here to allow the app to show the error via endpoints
        
    return client

db = initialize_firebase()


def get_db():
    return db

