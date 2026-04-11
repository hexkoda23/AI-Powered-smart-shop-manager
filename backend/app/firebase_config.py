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

    # Try to get project name from the app
    current_app = firebase_admin.get_app()
    proj_id = current_app.project_id
    print(f"DEBUG: Using Project ID: {proj_id}")

    # FORCE explicit project and database ID
    # This addresses the "database (default) does not exist" issue by being non-ambiguous
    try:
        client = firestore.client(project=proj_id, database="(default)")
        print(f"DEBUG: Firestore client created for project {proj_id} and database (default)")
    except Exception as e:
        print(f"DEBUG ERROR: Failed to create client: {e}")
        client = firestore.client() # Fallback

    try:
        # Check if we can reach the project
        print(f"DEBUG: Attempting to list collections in project {proj_id}...")
        colls = list(client.collections())
        print(f"DEBUG: Success! Found {len(colls)} collections.")
    except Exception as e:
        print(f"DEBUG ERROR: Connection check failed: {e}")
        # This will likely show the 'database (default) does not exist' error

        
    return client

db = initialize_firebase()



def get_db():
    return db

