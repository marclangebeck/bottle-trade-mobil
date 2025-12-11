from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Lade Umgebungsvariablen
load_dotenv()

# Datenbank-URL aus Umgebungsvariable (Standard: Platzhalter für lokale Entwicklung)
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://username:password@localhost/bottle_trade_mobile')

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency für FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
