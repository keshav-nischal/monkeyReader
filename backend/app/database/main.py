from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.ext.declarative import declarative_base
import os

Base = declarative_base()
DATABASE_URL = os.getenv("DATABASE_URL") # change to env
engine = create_engine(DATABASE_URL)

def get_sql_session():
    session = Session(engine)
    return session

