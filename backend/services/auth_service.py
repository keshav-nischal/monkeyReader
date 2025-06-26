from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
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

# Create security scheme
security = HTTPBearer()

def verify_token_and_get_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[firebase_auth.UserRecord]:
    try:
        id_token = credentials.credentials
        decoded_token = auth.verify_id_token(id_token)
        # print(decoded_token)
        uid = decoded_token['uid']
        user_record = auth.get_user(uid)
        print(user_record)
        return user_record
    except Exception as e:
        print(e)
        raise HTTPException(status_code=401, detail=f"Error verifying user: {e}")

