from fastapi import HTTPException
import firebase_admin
from firebase_admin import credentials, auth
import os
from typing import Optional
import firebase_admin.auth as firebase_auth

service_account_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "firebase",
    "serviceAccountKey.json"
)
cred = credentials.Certificate(os.path.abspath(service_account_path))
app = firebase_admin.initialize_app(cred)

def verify_token_and_get_user(id_token: str) -> Optional[firebase_auth.UserRecord]:
    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        user_record = auth.get_user(uid)
        print(user_record)
        return user_record
    except Exception as e:
        # Log the error or handle it appropriately
        raise HTTPException("401", f"Error verifying user: {e}")
