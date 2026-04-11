import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

# Path to the service account JSON
CRED_PATH = r"C:\Users\Tife\Downloads\notable-shop-manager-firebase-adminsdk-fbsvc-7a3d41b20e.json"

def debug_firestore():
    if not os.path.exists(CRED_PATH):
        print(f"Error: Credentials file not found at {CRED_PATH}")
        return

    try:
        with open(CRED_PATH) as f:
            cred_dict = json.load(f)
        
        print(f"Testing Project: {cred_dict.get('project_id')}")
        
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        
        print("Attempting to list collections...")
        collections = db.collections()
        col_list = list(collections)
        print(f"Successfully connected! Found {len(col_list)} collections.")
        for col in col_list:
            print(f" - Collection: {col.id}")

    except Exception as e:
        print(f"Firestore Test FAILED: {e}")

if __name__ == "__main__":
    debug_firestore()
