from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse
import threading
import queue
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.wein import Wein
from models.btp_transaction import BtpTransaction
from generate_invoice import generate_and_send_invoice
from email_service import (
    send_registration_confirmation_email,
    send_admin_notification_new_user,
    send_admin_notification_email_confirmed,
    send_user_activation_email
)
from firebase_admin import firestore, credentials
import firebase_admin
import os
from pydantic import BaseModel

app = FastAPI(title="Bottle Trade Mobile API", version="1.0.0")

# E-Mail-Queue für zuverlässigen Versand (unabhängig von Client-Timeout)
email_queue = queue.Queue()

def email_worker():
    """Worker-Thread der E-Mails aus der Queue verarbeitet"""
    import sys
    print("🔄 [WORKER] E-Mail-Worker-Thread gestartet", flush=True)
    sys.stdout.flush()
    while True:
        try:
            task = email_queue.get(timeout=1)
            if task is None:  # Shutdown signal
                print("🛑 [WORKER] Shutdown-Signal erhalten", flush=True)
                sys.stdout.flush()
                break
            func, args, kwargs = task
            queue_size_before = email_queue.qsize()
            print(f"🔄 [WORKER] Verarbeite E-Mail-Task aus Queue (Queue-Größe vorher: {queue_size_before + 1})", flush=True)
            sys.stdout.flush()
            try:
                func(*args, **kwargs)
                print(f"✅ [WORKER] E-Mail-Task erfolgreich verarbeitet", flush=True)
                sys.stdout.flush()
            except Exception as e:
                print(f"❌ [WORKER] Fehler in E-Mail-Worker: {e}", flush=True)
                sys.stdout.flush()
                import traceback
                traceback.print_exc()
            finally:
                email_queue.task_done()
        except queue.Empty:
            continue
        except Exception as e:
            print(f"❌ [WORKER] Fehler im E-Mail-Worker-Thread: {e}", flush=True)
            sys.stdout.flush()
            import traceback
            traceback.print_exc()

# Starte E-Mail-Worker-Thread
email_worker_thread = threading.Thread(target=email_worker, daemon=True)
email_worker_thread.start()
print("✅ E-Mail-Worker-Thread gestartet")

# CORS für Production (falls nötig)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: In Production spezifische Domains setzen
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# Rechnung generieren und versenden
@app.post("/orders/{order_id}/generate-invoice")
async def generate_invoice_endpoint(order_id: str):
    """
    Generiert PDF-Rechnung für eine Bestellung und versendet sie per E-Mail
    """
    return await generate_and_send_invoice(order_id)

# Firebase initialisieren (lazy - nur wenn benötigt)
def get_firestore_client():
    """Gibt Firestore-Client zurück, initialisiert Firebase falls nötig"""
    import sys
    try:
        if not firebase_admin._apps:
            cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-credentials.json')
            # Prüfe ob relativer oder absoluter Pfad
            if not os.path.isabs(cred_path):
                cred_path = os.path.join(os.path.dirname(__file__), cred_path)
            
            print(f"🔍 [FIREBASE] Suche Credentials in: {cred_path}", flush=True)
            sys.stdout.flush()
            
            if os.path.exists(cred_path):
                print(f"✅ [FIREBASE] Credentials gefunden, initialisiere Firebase...", flush=True)
                sys.stdout.flush()
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print(f"✅ [FIREBASE] Firebase erfolgreich initialisiert", flush=True)
                sys.stdout.flush()
            else:
                print(f"⚠️ [FIREBASE] Credentials-Datei nicht gefunden: {cred_path}", flush=True)
                sys.stdout.flush()
                # Versuche Default Credentials (z.B. in Cloud)
                try:
                    print(f"🔄 [FIREBASE] Versuche Default Credentials...", flush=True)
                    sys.stdout.flush()
                    firebase_admin.initialize_app()
                    print(f"✅ [FIREBASE] Default Credentials erfolgreich", flush=True)
                    sys.stdout.flush()
                except Exception as default_error:
                    print(f"❌ [FIREBASE] Firebase-Credentials nicht gefunden. E-Mail-Funktionen werden nicht verfügbar sein.", flush=True)
                    print(f"   Bitte lege firebase-credentials.json in backend-api/ ab.", flush=True)
                    print(f"   Fehler: {default_error}", flush=True)
                    sys.stdout.flush()
                    raise default_error
    except Exception as e:
        if "already initialized" not in str(e).lower():
            print(f"⚠️ [FIREBASE] Firebase-Initialisierung: {e}", flush=True)
            sys.stdout.flush()
    
    try:
        client = firestore.client()
        print(f"✅ [FIREBASE] Firestore-Client erstellt", flush=True)
        sys.stdout.flush()
        return client
    except Exception as e:
        print(f"❌ [FIREBASE] Firestore-Client konnte nicht erstellt werden: {e}", flush=True)
        sys.stdout.flush()
        import traceback
        traceback.print_exc()
        sys.stdout.flush()
        return None

# db_firestore wird lazy initialisiert
db_firestore = None

def get_db_firestore():
    """Lazy initialization von Firestore"""
    global db_firestore
    if db_firestore is None:
        db_firestore = get_firestore_client()
    return db_firestore

# E-Mail-Bestätigung Endpoints
class ConfirmEmailRequest(BaseModel):
    token: str

class SendRegistrationEmailRequest(BaseModel):
    userEmail: str
    username: str
    firstName: str = ""
    lastName: str = ""
    confirmationToken: str
    confirmationUrl: str
    webConfirmationUrl: str = None

class NotifyAdminNewUserRequest(BaseModel):
    userEmail: str
    username: str
    firstName: str
    lastName: str

@app.post("/auth/confirm-email")
async def confirm_email(request: ConfirmEmailRequest):
    """
    Bestätigt E-Mail-Adresse eines Users über Token
    """
    import sys
    import traceback
    try:
        token = request.token
        print(f"📧 [CONFIRM] E-Mail-Bestätigung angefordert für Token: {token[:10]}...", flush=True)
        sys.stdout.flush()
        
        # Suche User mit diesem Token
        db = get_db_firestore()
        if not db:
            print("❌ [CONFIRM] Firebase nicht konfiguriert", flush=True)
            sys.stdout.flush()
            raise HTTPException(status_code=500, detail="Firebase nicht konfiguriert")
        
        print(f"🔍 [CONFIRM] Suche User mit Token in Firestore...", flush=True)
        sys.stdout.flush()
        
        users_ref = db.collection('users')
        query = users_ref.where('emailConfirmationToken', '==', token).limit(1)
        docs = query.stream()
        
        user_doc = None
        user_data = None
        for doc in docs:
            user_doc = doc
            user_data = doc.to_dict()
            break
        
        if not user_doc:
            print(f"⚠️ [CONFIRM] Kein User mit Token gefunden", flush=True)
            sys.stdout.flush()
            raise HTTPException(status_code=404, detail="Ungültiger Bestätigungs-Token")
        
        print(f"✅ [CONFIRM] User gefunden: {user_data.get('email', 'unbekannt')}", flush=True)
        sys.stdout.flush()
        
        # Prüfe ob Token bereits verwendet wurde oder abgelaufen ist
        if user_data.get('emailConfirmed', False):
            print(f"ℹ️ [CONFIRM] E-Mail bereits bestätigt", flush=True)
            sys.stdout.flush()
            return {"message": "E-Mail wurde bereits bestätigt", "status": "already_confirmed"}
        
        print(f"🔄 [CONFIRM] Aktualisiere User-Status...", flush=True)
        sys.stdout.flush()
        
        # Aktualisiere User: E-Mail bestätigt, Status auf 'confirmed'
        user_doc.reference.update({
            'emailConfirmed': True,
            'emailConfirmedAt': firestore.SERVER_TIMESTAMP,
            'status': 'confirmed'
        })
        
        print(f"✅ [CONFIRM] User-Status aktualisiert", flush=True)
        sys.stdout.flush()
        
        # Lade aktualisierte User-Daten
        updated_user = user_doc.reference.get().to_dict()
        
        # Sende Benachrichtigung an Admin (im Hintergrund, blockiert nicht)
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@bottle-trade.de')
        print(f"📧 [CONFIRM] Sende Admin-Benachrichtigung...", flush=True)
        sys.stdout.flush()
        
        try:
            send_admin_notification_email_confirmed(
                admin_email,
                user_data.get('email', ''),
                user_data.get('username', ''),
                user_data.get('firstName', ''),
                user_data.get('lastName', '')
            )
            print(f"✅ [CONFIRM] Admin-Benachrichtigung gesendet", flush=True)
            sys.stdout.flush()
        except Exception as email_error:
            print(f"⚠️ [CONFIRM] Fehler beim Senden der Admin-Benachrichtigung: {email_error}", flush=True)
            sys.stdout.flush()
            # Nicht kritisch - E-Mail wurde bereits bestätigt
        
        print(f"✅ [CONFIRM] E-Mail-Bestätigung erfolgreich abgeschlossen", flush=True)
        sys.stdout.flush()
        
        return {
            "message": "E-Mail erfolgreich bestätigt",
            "status": "confirmed",
            "userId": user_doc.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [CONFIRM] Fehler bei E-Mail-Bestätigung: {e}", flush=True)
        sys.stdout.flush()
        traceback.print_exc()
        sys.stdout.flush()
        raise HTTPException(status_code=500, detail=f"Fehler bei E-Mail-Bestätigung: {str(e)}")

# Set für bereits verarbeitete E-Mail-Requests (verhindert doppelte E-Mails)
processed_email_requests = set()

@app.post("/auth/send-registration-email")
async def send_registration_email_endpoint(request: SendRegistrationEmailRequest):
    """
    Sendet Registrierungs-Bestätigungs-E-Mail an neuen User (asynchron im Hintergrund)
    """
    import sys
    import time
    
    # Erstelle eindeutigen Request-Key (User-Email + Token + Timestamp innerhalb 5 Sekunden)
    request_key = f"{request.userEmail}:{request.confirmationToken}:{int(time.time() / 5)}"
    
    # Prüfe ob dieser Request bereits verarbeitet wurde
    if request_key in processed_email_requests:
        print(f"⚠️ [DUPLIKAT] Request bereits verarbeitet für: {request.userEmail}", flush=True)
        sys.stdout.flush()
        return JSONResponse(
            status_code=200,
            content={"message": "E-Mail wurde bereits gesendet"}
        )
    
    # Markiere Request als verarbeitet
    processed_email_requests.add(request_key)
    
    # Alte Einträge entfernen (nur die letzten 1000 behalten)
    if len(processed_email_requests) > 1000:
        processed_email_requests.clear()
    
    print(f"📧 [REQUEST ERHALTEN] Plane Registrierungs-E-Mail-Versand an: {request.userEmail}", flush=True)
    sys.stdout.flush()
    
    # E-Mail-Versand in Queue (unabhängig von Client-Timeout)
    def send_email_task():
        import sys
        print(f"🔄 [TASK] Starte E-Mail-Versand für: {request.userEmail}", flush=True)
        sys.stdout.flush()
        try:
            success = send_registration_confirmation_email(
                user_email=request.userEmail,
                username=request.username,
                confirmation_token=request.confirmationToken,
                confirmation_url=request.confirmationUrl,
                web_confirmation_url=request.webConfirmationUrl,
                firstName=request.firstName if request.firstName else None,
                lastName=request.lastName if request.lastName else None
            )
            if success:
                print(f"✅ [TASK] Registrierungs-E-Mail erfolgreich gesendet an: {request.userEmail}", flush=True)
                sys.stdout.flush()
            else:
                print(f"⚠️ [TASK] Registrierungs-E-Mail konnte nicht gesendet werden an: {request.userEmail}", flush=True)
                sys.stdout.flush()
        except Exception as e:
            print(f"❌ [TASK] Fehler beim Senden der Registrierungs-E-Mail an {request.userEmail}: {e}", flush=True)
            sys.stdout.flush()
            import traceback
            traceback.print_exc()
            sys.stdout.flush()
    
    # Füge Task zur Queue hinzu (wird von Worker-Thread verarbeitet)
    email_queue.put((send_email_task, (), {}))
    print(f"📬 [QUEUE] E-Mail-Task zur Queue hinzugefügt für: {request.userEmail} (Queue-Größe: {email_queue.qsize()})", flush=True)
    sys.stdout.flush()
    
    # Antwort sofort zurückgeben (ohne auf E-Mail-Versand zu warten)
    response_data = {"message": "Registrierungs-E-Mail wird im Hintergrund gesendet"}
    print(f"✅ [RESPONSE] Sende Response für: {request.userEmail}", flush=True)
    sys.stdout.flush()
    return JSONResponse(
        status_code=200,
        content=response_data
    )

@app.post("/auth/notify-admin-new-user")
async def notify_admin_new_user_endpoint(request: NotifyAdminNewUserRequest):
    """
    Sendet Benachrichtigung an Admin über neue Registrierung (asynchron im Hintergrund)
    """
    import sys
    import time
    
    admin_email = os.getenv('ADMIN_EMAIL', 'admin@bottle-trade.de')
    
    # Erstelle eindeutigen Request-Key (User-Email + Timestamp innerhalb 5 Sekunden)
    request_key = f"admin:{request.userEmail}:{int(time.time() / 5)}"
    
    # Prüfe ob dieser Request bereits verarbeitet wurde
    if request_key in processed_email_requests:
        print(f"⚠️ [DUPLIKAT] Admin-Request bereits verarbeitet für: {request.userEmail}", flush=True)
        sys.stdout.flush()
        return JSONResponse(
            status_code=200,
            content={"message": "Admin-Benachrichtigung wurde bereits gesendet"}
        )
    
    # Markiere Request als verarbeitet
    processed_email_requests.add(request_key)
    
    print(f"📧 [REQUEST ERHALTEN] Plane Admin-Benachrichtigung für neuen User: {request.userEmail}", flush=True)
    sys.stdout.flush()
    
    # E-Mail-Versand in Queue (unabhängig von Client-Timeout)
    def send_admin_email_task():
        import sys
        print(f"🔄 [TASK] Starte Admin-Benachrichtigung für: {request.userEmail}", flush=True)
        sys.stdout.flush()
        try:
            success = send_admin_notification_new_user(
                admin_email,
                request.userEmail,
                request.username,
                request.firstName,
                request.lastName
            )
            if success:
                print(f"✅ [TASK] Admin-Benachrichtigung erfolgreich gesendet für User: {request.userEmail}", flush=True)
                sys.stdout.flush()
            else:
                print(f"⚠️ [TASK] Admin-Benachrichtigung konnte nicht gesendet werden für User: {request.userEmail}", flush=True)
                sys.stdout.flush()
        except Exception as e:
            print(f"❌ [TASK] Fehler beim Senden der Admin-Benachrichtigung für {request.userEmail}: {e}", flush=True)
            sys.stdout.flush()
            import traceback
            traceback.print_exc()
            sys.stdout.flush()
    
    # Füge Task zur Queue hinzu (wird von Worker-Thread verarbeitet)
    email_queue.put((send_admin_email_task, (), {}))
    print(f"📬 [QUEUE] Admin-Benachrichtigungs-Task zur Queue hinzugefügt für: {request.userEmail} (Queue-Größe: {email_queue.qsize()})", flush=True)
    sys.stdout.flush()
    
    # Antwort sofort zurückgeben (ohne auf E-Mail-Versand zu warten)
    response_data = {"message": "Admin-Benachrichtigung wird im Hintergrund gesendet"}
    print(f"✅ [RESPONSE] Sende Response für Admin-Benachrichtigung: {request.userEmail}", flush=True)
    sys.stdout.flush()
    return JSONResponse(
        status_code=200,
        content=response_data
    )

@app.post("/auth/send-activation-email")
async def send_activation_email(request: Request):
    """
    Sendet Aktivierungs-E-Mail an User (wird vom Admin aufgerufen)
    user_id wird als Query-Parameter übergeben
    """
    import sys
    
    try:
        # Extrahiere user_id aus Query-Parametern
        user_id = None
        if request:
            query_params = request.query_params
            user_id = query_params.get('user_id')
        
        print(f"📧 [ACTIVATION] Aktivierungs-E-Mail angefordert für User-ID: {user_id}", flush=True)
        sys.stdout.flush()
        
        if not user_id:
            print(f"❌ [ACTIVATION] user_id fehlt", flush=True)
            sys.stdout.flush()
            raise HTTPException(status_code=400, detail="user_id ist erforderlich")
        
        db = get_db_firestore()
        if not db:
            print(f"❌ [ACTIVATION] Firebase nicht konfiguriert", flush=True)
            sys.stdout.flush()
            raise HTTPException(status_code=500, detail="Firebase nicht konfiguriert")
        
        print(f"🔍 [ACTIVATION] Suche User in Firestore: {user_id}", flush=True)
        sys.stdout.flush()
        
        # Versuche zuerst mit Document-ID
        user_doc = db.collection('users').document(user_id).get()
        
        # Falls nicht gefunden, suche nach uid-Feld
        if not user_doc.exists:
            print(f"🔄 [ACTIVATION] User nicht mit Document-ID gefunden, suche nach uid-Feld...", flush=True)
            sys.stdout.flush()
            users_ref = db.collection('users')
            query = users_ref.where('uid', '==', user_id).limit(1)
            docs = list(query.stream())
            if docs:
                user_doc = docs[0]
                print(f"✅ [ACTIVATION] User über uid-Feld gefunden: {user_doc.id}", flush=True)
                sys.stdout.flush()
            else:
                print(f"⚠️ [ACTIVATION] User nicht gefunden (weder Document-ID noch uid): {user_id}", flush=True)
                sys.stdout.flush()
                raise HTTPException(status_code=404, detail=f"User nicht gefunden: {user_id}")
        
        user_data = user_doc.to_dict()
        user_email = user_data.get('email', '')
        username = user_data.get('username', '')
        
        print(f"✅ [ACTIVATION] User gefunden: {user_email}", flush=True)
        sys.stdout.flush()
        
        # Sende Aktivierungs-E-Mail (im Hintergrund über Queue)
        def send_activation_email_task():
            import sys
            print(f"🔄 [TASK] Starte Aktivierungs-E-Mail-Versand für: {user_email}", flush=True)
            sys.stdout.flush()
            try:
                success = send_user_activation_email(user_email, username)
                if success:
                    print(f"✅ [TASK] Aktivierungs-E-Mail erfolgreich gesendet an: {user_email}", flush=True)
                    sys.stdout.flush()
                else:
                    print(f"⚠️ [TASK] Aktivierungs-E-Mail konnte nicht gesendet werden an: {user_email}", flush=True)
                    sys.stdout.flush()
            except Exception as e:
                print(f"❌ [TASK] Fehler beim Senden der Aktivierungs-E-Mail an {user_email}: {e}", flush=True)
                sys.stdout.flush()
                import traceback
                traceback.print_exc()
                sys.stdout.flush()
        
        # Füge Task zur Queue hinzu
        email_queue.put((send_activation_email_task, (), {}))
        print(f"📬 [QUEUE] Aktivierungs-E-Mail-Task zur Queue hinzugefügt für: {user_email} (Queue-Größe: {email_queue.qsize()})", flush=True)
        sys.stdout.flush()
        
        return {"message": "Aktivierungs-E-Mail wird im Hintergrund gesendet"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [ACTIVATION] Fehler beim Senden der Aktivierungs-E-Mail: {e}", flush=True)
        sys.stdout.flush()
        import traceback
        traceback.print_exc()
        sys.stdout.flush()
        raise HTTPException(status_code=500, detail=f"Fehler beim Senden der E-Mail: {str(e)}")
