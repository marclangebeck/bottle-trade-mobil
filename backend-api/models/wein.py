from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Wein(Base):
    __tablename__ = "weine"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    jahrgang = Column(Integer)
    weingut = Column(String)
    beschreibung = Column(Text)
    preis = Column(String)
    verfuegbar = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime)
    
    # Beziehung zum User
    user = relationship("User", back_populates="weine")
