"""
Jugno Overseas Consultancy — Flask backend
Handles page rendering and application form submissions.
"""

import os
import re
from datetime import datetime, timezone

from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")

# Database configuration.
database_url = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(basedir, 'instance', 'jugno.db')}")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8 MB upload limit

db = SQLAlchemy(app)

UPLOAD_FOLDER = os.path.join(basedir, "static", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "doc", "docx"}


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class Application(db.Model):
    """A submitted service application / lead from the website."""

    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    full_name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    email = db.Column(db.String(150), nullable=False)
    service = db.Column(db.String(150), nullable=False)
    destination = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=True)
    document_filename = db.Column(db.String(255), nullable=True)

    status = db.Column(db.String(30), nullable=False, default="New")

    def to_dict(self):
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat(),
            "full_name": self.full_name,
            "phone": self.phone,
            "email": self.email,
            "service": self.service,
            "destination": self.destination,
            "message": self.message,
            "document_filename": self.document_filename,
            "status": self.status,
        }


with app.app_context():
    db.create_all()


# ---------------------------------------------------------------------------
# Services Master List
# ---------------------------------------------------------------------------
SERVICES = [
    {
        "title": "Job Visa Assistance",
        "description": "Complete facilitation and guidance for employment and job visa processing requirements.",
    },
    {
        "title": "Work Visa Services",
        "description": "End-to-end support for official work permit documentation and overseas employment visas.",
    },
    {
        "title": "Visit Visa Facilitation",
        "description": "Professional guidance and application support for tourist and short-term visit visas.",
    },
    {
        "title": "Family Visa Services",
        "description": "Assistance with residence, spouse, and family join visas for overseas destinations.",
    },
    {
        "title": "HEC Degree Attestation & Verification",
        "description": "Assistance with HEC degree attestation and verification requirements for documents intended for overseas use.",
    },
    {
        "title": "IBCC Verification",
        "description": "Guidance and facilitation for IBCC verification of educational certificates and related documents.",
    },
    {
        "title": "Apostille Services",
        "description": "Assistance with Apostille documentation requirements for international use.",
    },
    {
        "title": "MoFA Verification",
        "description": "Guidance for Ministry of Foreign Affairs document verification and attestation procedures.",
    },
    {
        "title": "All Boards Verification",
        "description": "Facilitation for verification of educational certificates issued by different boards in Pakistan.",
    },
    {
        "title": "Embassy Verification",
        "description": "Assistance with embassy verification and attestation requirements for overseas documentation.",
    },
    {
        "title": "Other Verification",
        "description": "Custom attestation, verification, and document consultancy services tailored to your specific needs.",
    },
]


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_RE = re.compile(r"^[0-9+\-\s()]{7,20}$")

VALID_SERVICES = {s["title"] for s in SERVICES}

VALID_DESTINATIONS = {
    "Dubai / UAE",
    "Qatar",
    "Kuwait",
    "Malaysia",
    "Saudi Arabia",
    "Other Country",
}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_application(form):
    errors = {}

    full_name = (form.get("full_name") or "").strip()
    phone = (form.get("phone") or "").strip()
    email = (form.get("email") or "").strip()
    service = (form.get("service") or "").strip()
    destination = (form.get("destination") or "").strip()

    if not full_name or len(full_name) < 2:
        errors["full_name"] = "Please enter your full name."

    if not phone or not PHONE_RE.match(phone):
        errors["phone"] = "Please enter a valid phone / WhatsApp number."

    if not email or not EMAIL_RE.match(email):
        errors["email"] = "Please enter a valid email address."

    if service not in VALID_SERVICES:
        errors["service"] = "Please select a service."

    if destination not in VALID_DESTINATIONS:
        errors["destination"] = "Please select a destination."

    return errors


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route("/")
def home():
    return render_template("index.html", services=SERVICES)


@app.route("/api/apply", methods=["POST"])
def apply():
    errors = validate_application(request.form)
    if errors:
        return jsonify({"success": False, "errors": errors}), 400

    document_filename = None
    uploaded_file = request.files.get("document")
    if uploaded_file and uploaded_file.filename:
        if not allowed_file(uploaded_file.filename):
            return jsonify({
                "success": False,
                "errors": {"document": "Allowed file types: PDF, JPG, PNG, DOC, DOCX."},
            }), 400
        from werkzeug.utils import secure_filename

        safe_name = secure_filename(uploaded_file.filename)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        document_filename = f"{timestamp}_{safe_name}"
        uploaded_file.save(os.path.join(UPLOAD_FOLDER, document_filename))

    new_application = Application(
        full_name=request.form.get("full_name").strip(),
        phone=request.form.get("phone").strip(),
        email=request.form.get("email").strip(),
        service=request.form.get("service").strip(),
        destination=request.form.get("destination").strip(),
        message=(request.form.get("message") or "").strip(),
        document_filename=document_filename,
    )
    db.session.add(new_application)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Thank you! Your request has been received. Jugno Overseas Consultancy will contact you soon.",
        "id": new_application.id,
    }), 201


@app.route("/api/applications", methods=["GET"])
def list_applications():
    admin_key = request.args.get("key")
    expected_key = os.environ.get("ADMIN_KEY")
    if not expected_key or admin_key != expected_key:
        return jsonify({"success": False, "message": "Unauthorized."}), 401

    applications = Application.query.order_by(Application.created_at.desc()).all()
    return jsonify({"success": True, "count": len(applications), "applications": [a.to_dict() for a in applications]})


@app.route("/healthz")
def healthz():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG", "false").lower() == "true")