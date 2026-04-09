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
                # Fix private key: Render/env vars may double-escape \n as \\n
                if "private_key" in cred_dict:
                    cred_dict["private_key"] = cred_dict["private_key"].replace("\\n", "\n")
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print("Firebase initialized from FIREBASE_CONFIG_JSON env var.")
            except Exception as e:
                print(f"ERROR initializing Firebase from JSON string: {e}")
                raise

        # Priority 2: FIREBASE_SERVICE_ACCOUNT env var (path to file)
        elif os.getenv("FIREBASE_SERVICE_ACCOUNT"):
            try:
                cred = credentials.Certificate(os.getenv("FIREBASE_SERVICE_ACCOUNT"))
                firebase_admin.initialize_app(cred)
                print("Firebase initialized from service account file.")
            except Exception as e:
                print(f"ERROR initializing Firebase from file: {e}")
                raise
        else:
            raise RuntimeError(
                "Firebase credentials not found. Set FIREBASE_CONFIG_JSON or "
                "FIREBASE_SERVICE_ACCOUNT environment variable."
            )

    return firestore.client()

db = initialize_firebase()

def get_db():
    return db

