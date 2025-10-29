from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class BtpTransaction(Base):
    __tablename__ = "btp_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Integer)
    reason = Column(String)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    paypal_transaction_id = Column(String, nullable=True)
    timestamp = Column(DateTime)
    
    # Beziehungen
    user = relationship("User", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[admin_id])
