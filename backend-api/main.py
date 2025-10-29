from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.wein import Wein
from models.btp_transaction import BtpTransaction

app = FastAPI(title="Bottle Trade Mobile API", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "Bottle Trade Mobile API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# User-Endpoints
@app.get("/users/")
async def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@app.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Wein-Endpoints
@app.get("/weine/")
async def get_weine(db: Session = Depends(get_db)):
    weine = db.query(Wein).all()
    return weine

@app.get("/weine/{wein_id}")
async def get_wein(wein_id: int, db: Session = Depends(get_db)):
    wein = db.query(Wein).filter(Wein.id == wein_id).first()
    if wein is None:
        raise HTTPException(status_code=404, detail="Wein not found")
    return wein

# BTP-Transaction-Endpoints
@app.get("/btp-transactions/")
async def get_btp_transactions(db: Session = Depends(get_db)):
    transactions = db.query(BtpTransaction).all()
    return transactions

@app.get("/btp-transactions/{transaction_id}")
async def get_btp_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(BtpTransaction).filter(BtpTransaction.id == transaction_id).first()
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction
