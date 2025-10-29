from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    vorname = Column(String)
    nachname = Column(String)
    strasse = Column(String)
    plz = Column(String)
    ort = Column(String)
    profilbild = Column(String)
    aktiv = Column(Boolean, default=True)
    created_at = Column(DateTime)
    latitude = Column(Float)
    longitude = Column(Float)
    is_winery = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    btp = Column(Integer, default=0)
    is_subscriber = Column(Boolean, default=False)
    is_ad_free = Column(Boolean, default=False)
    wishlist_unlocked = Column(Boolean, default=False)
    abo_typ = Column(String)
    newsletter_optin = Column(Boolean, default=False)
    newsletter_btp_granted = Column(Boolean, default=False)
    bio = Column(Text)
    is_profile_public = Column(Boolean, default=True)
    show_email = Column(Boolean, default=False)
    show_address = Column(Boolean, default=False)
    show_full_name = Column(Boolean, default=False)
