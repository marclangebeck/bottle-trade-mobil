"""
PDF-Rechnung generieren und per E-Mail versenden
"""
from fastapi import HTTPException
from firebase_admin import firestore, credentials
import firebase_admin
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
import io

# Firebase initialisieren (lazy - nur wenn benötigt)
def get_firestore_client():
    """Gibt Firestore-Client zurück, initialisiert Firebase falls nötig"""
    try:
        if not firebase_admin._apps:
            # Verwende Service Account Key aus Umgebungsvariable oder Datei
            cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-credentials.json')
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                # Fallback: Verwende Default Credentials (z.B. in Cloud)
                firebase_admin.initialize_app()
    except Exception as e:
        print(f"⚠️ Firebase bereits initialisiert oder Fehler: {e}")
    
    return firestore.client()

# db wird lazy initialisiert, wenn benötigt
_db = None

def get_db():
    """Lazy initialization von Firestore"""
    global _db
    if _db is None:
        _db = get_firestore_client()
    return _db

def generate_invoice_pdf(order_data, user_data):
    """Generiert PDF-Rechnung aus Bestell- und User-Daten"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#2c2c2c'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2c2c2c'),
        spaceAfter=12
    )
    
    # Titel
    story.append(Paragraph("Rechnung", title_style))
    story.append(Spacer(1, 20))
    
    # Firmendaten
    firm_data = [
        ['Bottle-Trade', ''],
        ['', ''],
        ['Bestellnummer:', f"#{order_data.get('id', 'N/A')[:8]}"],
        ['Bestelldatum:', format_date(order_data.get('createdAt'))],
        ['Rechnungsdatum:', datetime.now().strftime('%d.%m.%Y')],
    ]
    
    firm_table = Table(firm_data, colWidths=[80*mm, 110*mm])
    firm_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(firm_table)
    story.append(Spacer(1, 20))
    
    # Kundenadresse
    story.append(Paragraph("Rechnungsempfänger:", heading_style))
    customer_address = [
        f"{user_data.get('firstName', '')} {user_data.get('lastName', '')}",
        user_data.get('email', ''),
    ]
    if user_data.get('street'):
        customer_address.insert(1, user_data.get('street', ''))
    if user_data.get('zipCode') or user_data.get('city'):
        customer_address.append(f"{user_data.get('zipCode', '')} {user_data.get('city', '')}")
    
    for line in customer_address:
        if line.strip():
            story.append(Paragraph(line, styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Artikel-Tabelle
    story.append(Paragraph("Artikel", heading_style))
    
    table_data = [['Artikel', 'Menge', 'Einzelpreis', 'Gesamtpreis']]
    
    items = order_data.get('items', [])
    for item in items:
        name = item.get('name', '')
        variant = item.get('variantName', '')
        if variant:
            name += f" ({variant})"
        
        quantity = item.get('quantity', 0)
        price = item.get('priceGross', item.get('price', 0) * 1.19)
        total = price * quantity
        
        table_data.append([
            name,
            str(quantity),
            f"{price:.2f} €",
            f"{total:.2f} €"
        ])
    
    # Preisübersicht
    subtotal = order_data.get('subtotal', 0)
    tax = order_data.get('tax', 0)
    shipping = order_data.get('shippingCost', 0)
    if order_data.get('shippingCostFree'):
        shipping = 0
    total = order_data.get('total', 0)
    
    table_data.append(['', '', '', ''])  # Leerzeile
    table_data.append(['Zwischensumme (netto):', '', '', f"{subtotal:.2f} €"])
    table_data.append(['MwSt. (19%):', '', '', f"{tax:.2f} €"])
    table_data.append(['Versandkosten:', '', '', f"{shipping:.2f} €"])
    table_data.append(['<b>Gesamtbetrag:</b>', '', '', f"<b>{total:.2f} €</b>"])
    
    table = Table(table_data, colWidths=[100*mm, 30*mm, 30*mm, 30*mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#a9c7cd')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2c2c2c')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -2), 1, colors.grey),
        ('LINEBELOW', (0, -5), (-1, -5), 2, colors.HexColor('#a9c7cd')),
        ('FONTNAME', (0, -4), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -4), (-1, -1), 11),
    ]))
    story.append(table)
    story.append(Spacer(1, 30))
    
    # Zahlungsinformationen
    story.append(Paragraph("Zahlungsinformationen", heading_style))
    payment_method = order_data.get('paymentMethod', 'PayPal')
    payment_id = order_data.get('paymentId', '')
    
    payment_info = f"Zahlungsmethode: {payment_method}"
    if payment_id:
        payment_info += f"<br/>Transaction ID: {payment_id}"
    
    story.append(Paragraph(payment_info, styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Footer
    story.append(Spacer(1, 20))
    footer_text = "Vielen Dank für Ihren Einkauf bei Bottle-Trade!"
    story.append(Paragraph(footer_text, styles['Normal']))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def format_date(timestamp):
    """Formatiert Firestore Timestamp zu deutschem Datum"""
    if not timestamp:
        return datetime.now().strftime('%d.%m.%Y')
    
    try:
        if hasattr(timestamp, 'to_date'):
            date = timestamp.to_date()
        elif hasattr(timestamp, 'seconds'):
            date = datetime.fromtimestamp(timestamp.seconds)
        else:
            date = datetime.now()
        return date.strftime('%d.%m.%Y')
    except:
        return datetime.now().strftime('%d.%m.%Y')

def send_invoice_email(user_email, user_name, order_id, pdf_data):
    """Sendet Rechnung per E-Mail"""
    try:
        # E-Mail-Konfiguration (aus Umgebungsvariablen)
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))
        smtp_user = os.getenv('SMTP_USER', '')
        smtp_password = os.getenv('SMTP_PASSWORD', '')
        from_email = os.getenv('FROM_EMAIL', 'noreply@bottle-trade.de')
        
        if not smtp_user or not smtp_password:
            print("⚠️ SMTP-Credentials nicht konfiguriert, E-Mail wird nicht versendet")
            return False
        
        # E-Mail erstellen
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = user_email
        msg['Subject'] = f"Rechnung für Bestellung #{order_id[:8]} - Bottle-Trade"
        
        # E-Mail-Text
        body = f"""
Hallo {user_name},

vielen Dank für Ihre Bestellung bei Bottle-Trade!

Anbei finden Sie Ihre Rechnung als PDF.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
Ihr Bottle-Trade Team
"""
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # PDF anhängen
        attachment = MIMEBase('application', 'pdf')
        attachment.set_payload(pdf_data)
        encoders.encode_base64(attachment)
        attachment.add_header(
            'Content-Disposition',
            f'attachment; filename=Rechnung_{order_id[:8]}.pdf'
        )
        msg.attach(attachment)
        
        # E-Mail versenden
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        text = msg.as_string()
        server.sendmail(from_email, user_email, text)
        server.quit()
        
        print(f"✅ Rechnung per E-Mail versendet an: {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Fehler beim Versenden der E-Mail: {e}")
        return False

async def generate_and_send_invoice(order_id: str):
    """Hauptfunktion: Rechnung generieren und versenden"""
    try:
        # Bestellung aus Firestore abrufen
        db = get_db()
        order_ref = db.collection('orders').document(order_id)
        order_doc = order_ref.get()
        
        if not order_doc.exists:
            raise HTTPException(status_code=404, detail="Bestellung nicht gefunden")
        
        order_data = {**order_doc.to_dict(), 'id': order_doc.id}
        
        # User-Daten abrufen
        user_id = order_data.get('userId')
        if not user_id:
            raise HTTPException(status_code=400, detail="Keine User-ID in Bestellung gefunden")
        
        db = get_db()
        user_ref = db.collection('users').where('uid', '==', user_id).limit(1).get()
        if not user_ref:
            raise HTTPException(status_code=404, detail="User nicht gefunden")
        
        user_data = user_ref[0].to_dict()
        user_email = user_data.get('email', '')
        user_name = f"{user_data.get('firstName', '')} {user_data.get('lastName', '')}".strip()
        
        if not user_email:
            raise HTTPException(status_code=400, detail="Keine E-Mail-Adresse für User gefunden")
        
        # PDF generieren
        pdf_data = generate_invoice_pdf(order_data, user_data)
        
        # E-Mail versenden
        email_sent = send_invoice_email(user_email, user_name, order_id, pdf_data)
        
        # PDF-URL in Firestore speichern (optional)
        # Hier könnte man das PDF auch in Firebase Storage hochladen
        
        return {
            "success": True,
            "order_id": order_id,
            "email_sent": email_sent,
            "message": "Rechnung wurde generiert und per E-Mail versendet" if email_sent else "Rechnung wurde generiert, aber E-Mail konnte nicht versendet werden"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Fehler beim Generieren der Rechnung: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Generieren der Rechnung: {str(e)}")


