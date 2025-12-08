"""
E-Mail-Service für Registrierung und Bestätigung
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
import secrets
import string

load_dotenv()

# SMTP-Konfiguration aus Umgebungsvariablen
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@bottle-trade.de')
FROM_EMAIL = os.getenv('FROM_EMAIL', SMTP_USER)

def generate_confirmation_token(length=32):
    """Generiert einen sicheren Bestätigungs-Token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def send_email(to_email, subject, html_body, text_body=None):
    """
    Sendet eine E-Mail
    
    Args:
        to_email: Empfänger-E-Mail-Adresse
        subject: Betreff
        html_body: HTML-Inhalt
        text_body: Plain-Text-Inhalt (optional, wird aus HTML generiert wenn nicht angegeben)
    
    Returns:
        bool: True wenn erfolgreich, False bei Fehler
    """
    try:
        if not SMTP_USER or not SMTP_PASSWORD:
            print('⚠️ SMTP-Konfiguration fehlt. E-Mail wird nicht gesendet.')
            return False
        
        # Debug: Zeige E-Mail-Details
        print(f'📧 E-Mail-Versand:')
        print(f'   Von: {FROM_EMAIL}')
        print(f'   An: {to_email}')
        print(f'   Betreff: {subject}')
        
        # Erstelle E-Mail
        msg = MIMEMultipart('alternative')
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Plain-Text-Version (falls nicht angegeben, aus HTML generieren)
        if not text_body:
            # Einfache HTML-zu-Text-Konvertierung
            import re
            text_body = re.sub(r'<[^>]+>', '', html_body)
            text_body = text_body.replace('&nbsp;', ' ')
            text_body = text_body.replace('&amp;', '&')
            text_body = text_body.replace('&lt;', '<')
            text_body = text_body.replace('&gt;', '>')
        
        # Füge beide Versionen hinzu
        part1 = MIMEText(text_body, 'plain', 'utf-8')
        part2 = MIMEText(html_body, 'html', 'utf-8')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Verbinde mit SMTP-Server
        # Port 465 verwendet SSL, Port 587 verwendet STARTTLS
        if SMTP_PORT == 465:
            # SSL-Verbindung für Port 465
            import ssl
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        else:
            # STARTTLS für Port 587
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        
        print(f'✅ E-Mail erfolgreich gesendet an: {to_email}', flush=True)
        import sys
        sys.stdout.flush()
        return True
        
    except Exception as e:
        print(f'❌ Fehler beim Senden der E-Mail an {to_email}: {e}', flush=True)
        import sys
        sys.stdout.flush()
        return False

def send_registration_confirmation_email(user_email, username, confirmation_token, confirmation_url, web_confirmation_url=None, firstName=None, lastName=None):
    """
    Sendet Bestätigungs-E-Mail an neuen User
    
    Args:
        user_email: E-Mail-Adresse des Users
        username: Benutzername
        confirmation_token: Bestätigungs-Token
        confirmation_url: URL zum Bestätigen (z.B. https://bottle-trade.de/confirm?token=XXX)
        firstName: Vorname (optional)
        lastName: Nachname (optional)
    
    Returns:
        bool: True wenn erfolgreich
    """
    # Bestimme Anzeigename: firstName + lastName, falls verfügbar, sonst username
    display_name = username
    if firstName and lastName:
        display_name = f"{firstName} {lastName}"
    elif firstName:
        display_name = firstName
    elif lastName:
        display_name = lastName
    subject = 'Willkommen bei Bottle-Trade - Bitte bestätigen Sie Ihre E-Mail'
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #2c2c2c;
                color: #ffffff;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 5px 5px;
            }}
            .button {{
                display: inline-block;
                background-color: #DAA520;
                color: #2c2c2c;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🍷 Willkommen bei Bottle-Trade!</h1>
        </div>
        <div class="content">
            <p>Hallo {display_name},</p>
            
            <p>vielen Dank für Ihre Registrierung bei Bottle-Trade!</p>
            
            <p>Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Button klicken:</p>
            
            <p style="text-align: center;">
                <a href="{confirmation_url}" class="button" style="color: #2c2c2c !important; text-decoration: none !important; display: inline-block;">E-Mail bestätigen (App öffnen)</a>
            </p>
            
            <p>Falls der Button nicht funktioniert, können Sie auch diesen Link manuell in der App öffnen:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px; font-family: monospace; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">{confirmation_url}</p>
            
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
                <strong>Hinweis:</strong> Deep Links funktionieren nur in der installierten App. 
                Falls Sie in Expo Go testen, kopieren Sie den Link oben und öffnen Sie ihn manuell, 
                oder geben Sie den Token unten manuell in der App ein.
            </p>
            
            {web_confirmation_url and f'''
            <p style="margin-top: 20px;">Alternativ können Sie den Bestätigungs-Token auch manuell in der App eingeben:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px; font-family: monospace; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">{confirmation_token}</p>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">Öffnen Sie die App und geben Sie diesen Token im Bestätigungs-Screen ein.</p>
            ''' or ''}
            
            <p>Nach der Bestätigung wird ein Admin Ihr Konto freischalten. Sie erhalten dann eine weitere E-Mail, sobald Ihr Konto aktiviert wurde.</p>
            
            <p>Falls Sie sich nicht bei Bottle-Trade registriert haben, können Sie diese E-Mail ignorieren.</p>
        </div>
        <div class="footer">
            <p>Mit freundlichen Grüßen,<br>Ihr Bottle-Trade Team</p>
            <p>Bottle-Trade - Tausch dich durch die Welt der Weine.</p>
        </div>
    </body>
    </html>
    """
    
    return send_email(user_email, subject, html_body)

def send_admin_notification_new_user(admin_email, user_email, username, firstName, lastName):
    """
    Sendet Benachrichtigung an Admin über neue Registrierung
    
    Args:
        admin_email: E-Mail-Adresse des Admins
        user_email: E-Mail-Adresse des neuen Users
        username: Benutzername
        firstName: Vorname
        lastName: Nachname
    
    Returns:
        bool: True wenn erfolgreich
    """
    subject = 'Neue Registrierung bei Bottle-Trade'
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #2c2c2c;
                color: #ffffff;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 5px 5px;
            }}
            .info-box {{
                background-color: #fff;
                border-left: 4px solid #DAA520;
                padding: 15px;
                margin: 20px 0;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔔 Neue Registrierung</h1>
        </div>
        <div class="content">
            <p>Ein neuer User hat sich bei Bottle-Trade registriert:</p>
            
            <div class="info-box">
                <p><strong>Benutzername:</strong> {username}</p>
                <p><strong>E-Mail:</strong> {user_email}</p>
                <p><strong>Name:</strong> {firstName} {lastName}</p>
                <p><strong>Status:</strong> <span style="color: #ff9800;">Wartet auf E-Mail-Bestätigung</span></p>
            </div>
            
            <p>Bitte prüfen Sie den User im Admin-Bereich und schalten Sie ihn nach der E-Mail-Bestätigung frei.</p>
        </div>
        <div class="footer">
            <p>Bottle-Trade Admin-Benachrichtigung</p>
        </div>
    </body>
    </html>
    """
    
    return send_email(admin_email, subject, html_body)

def send_admin_notification_email_confirmed(admin_email, user_email, username, firstName, lastName):
    """
    Sendet Benachrichtigung an Admin, dass User seine E-Mail bestätigt hat
    
    Args:
        admin_email: E-Mail-Adresse des Admins
        user_email: E-Mail-Adresse des Users
        username: Benutzername
        firstName: Vorname
        lastName: Nachname
    
    Returns:
        bool: True wenn erfolgreich
    """
    subject = 'E-Mail-Bestätigung erhalten - User wartet auf Freischaltung'
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #2c2c2c;
                color: #ffffff;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 5px 5px;
            }}
            .info-box {{
                background-color: #fff;
                border-left: 4px solid #4CAF50;
                padding: 15px;
                margin: 20px 0;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>✅ E-Mail bestätigt</h1>
        </div>
        <div class="content">
            <p>Ein User hat seine E-Mail-Adresse bestätigt und wartet nun auf Freischaltung:</p>
            
            <div class="info-box">
                <p><strong>Benutzername:</strong> {username}</p>
                <p><strong>E-Mail:</strong> {user_email}</p>
                <p><strong>Name:</strong> {firstName} {lastName}</p>
                <p><strong>Status:</strong> <span style="color: #4CAF50;">E-Mail bestätigt - Wartet auf Freischaltung</span></p>
            </div>
            
            <p>Bitte prüfen Sie den User im Admin-Bereich und schalten Sie ihn frei.</p>
        </div>
        <div class="footer">
            <p>Bottle-Trade Admin-Benachrichtigung</p>
        </div>
    </body>
    </html>
    """
    
    return send_email(admin_email, subject, html_body)

def send_user_activation_email(user_email, username):
    """
    Sendet E-Mail an User, dass sein Konto aktiviert wurde
    
    Args:
        user_email: E-Mail-Adresse des Users
        username: Benutzername
    
    Returns:
        bool: True wenn erfolgreich
    """
    subject = 'Ihr Bottle-Trade Konto wurde aktiviert'
    
    # Deep Link zur App (öffnet Login-Screen)
    app_link = "bottletrade://login"
    web_fallback = "https://bottle-trade.de"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #2c2c2c;
                color: #ffffff;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 5px 5px;
            }}
            .button {{
                display: inline-block;
                background-color: #DAA520;
                color: #2c2c2c;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>✅ Konto aktiviert</h1>
        </div>
        <div class="content">
            <p>Hallo {username},</p>
            
            <p>Ihr Bottle-Trade Konto wurde erfolgreich aktiviert!</p>
            
            <p>Sie können sich jetzt anmelden und die App nutzen.</p>
            
            <p style="text-align: center;">
                <a href="{app_link}" class="button" style="color: #2c2c2c !important; text-decoration: none !important; display: inline-block;">Zur App öffnen</a>
            </p>
            
            <p>Falls der Button nicht funktioniert, können Sie auch diesen Link in der App öffnen:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">{app_link}</p>
            
            <p style="font-size: 12px; color: #666; margin-top: 15px;">
                <strong>Hinweis:</strong> Falls Sie die App noch nicht installiert haben oder in Expo Go testen, 
                öffnen Sie die App manuell und melden Sie sich an.
            </p>
            
            <p>Wir wünschen Ihnen viel Spaß beim Tauschen Ihrer Weine!</p>
        </div>
        <div class="footer">
            <p>Mit freundlichen Grüßen,<br>Ihr Bottle-Trade Team</p>
            <p>Bottle-Trade - Tausch dich durch die Welt der Weine.</p>
        </div>
    </body>
    </html>
    """
    
    return send_email(user_email, subject, html_body)

