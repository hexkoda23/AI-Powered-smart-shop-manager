import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from dotenv import load_dotenv

load_dotenv()

_db_client = None

def initialize_firebase():
    global _db_client
    if _db_client is not None:
        return _db_client

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
                print(f"DEBUG: Firebase Admin SDK initialized for project: {project_id}")
            except Exception as e:
                print(f"DEBUG ERROR: Failed to parse or init with JSON: {e}")
                raise
        elif os.getenv("FIREBASE_SERVICE_ACCOUNT"):
            try:
                cred = credentials.Certificate(os.getenv("FIREBASE_SERVICE_ACCOUNT"))
                firebase_admin.initialize_app(cred)
                print(f"DEBUG: Firebase initialized from file: {os.getenv('FIREBASE_SERVICE_ACCOUNT')}")
            except Exception as e:
                print(f"DEBUG ERROR: Failed to init from file: {e}")
                raise
        else:
            raise RuntimeError("Missing FIREBASE_CONFIG_JSON or FIREBASE_SERVICE_ACCOUNT.")

    current_app = firebase_admin.get_app()
    proj_id = current_app.project_id

    # Create client but DON'T make network calls yet to avoid startup Timeout/Crash
    try:
        _db_client = firestore.client(project=proj_id, database="(default)")
        print(f"DEBUG: Firestore client created for project {proj_id}")
    except Exception as e:
        print(f"DEBUG ERROR: Failed to create client: {e}")
        _db_client = firestore.client() 

    return _db_client

def get_db():
    return initialize_firebase()


