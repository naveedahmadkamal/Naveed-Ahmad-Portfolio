# Jugno Overseas Consultancy — Website

A complete, production-ready website for **Jugno Overseas Consultancy**, an Islamabad-based
consultancy offering facilitation for HEC, IBCC, Apostille, MoFA, board and embassy document
verification for overseas use.

- **Frontend:** HTML5, CSS3, vanilla JavaScript (responsive, animated, no build step)
- **Backend:** Python Flask
- **Database:** SQLite locally (`instance/jugno.db`), swappable to PostgreSQL via `DATABASE_URL`
- **Deployment target:** [Render](https://render.com)

---

## 1. Project structure

```
jugno/
├── app.py                  # Flask app, routes, models, validation
├── requirements.txt
├── Procfile                 # gunicorn app:app
├── render.yaml               # Render deployment blueprint
├── .env.example
├── templates/
│   ├── index.html            # Home page (head, nav, hero, services, destinations, about)
│   └── partials.html         # How it works, why us, application form, contact, footer
├── static/
│   ├── css/style.css
│   ├── js/script.js
│   ├── images/                # favicon.svg, og-cover.svg
│   └── uploads/                # uploaded application documents (gitignored)
└── instance/
    └── jugno.db                # created automatically on first run
```

## 2. Run locally

```bash
# 1. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy environment variables
cp .env.example .env
# then edit .env and set a real SECRET_KEY (and ADMIN_KEY if you want the admin API)

# 4. Run the app
python app.py
```

The site will be available at **http://localhost:5000**. The SQLite database and its table are
created automatically on first run (`instance/jugno.db`).

## 3. What the app does

- Serves the full one-page website (`/`).
- Handles the **Start Your Application** form via `POST /api/apply`:
  - Server-side validation of name, phone, email, service and destination (in addition to the
    JavaScript validation in the browser).
  - Optional document upload (PDF, JPG, PNG, DOC, DOCX — max 8&nbsp;MB), stored under
    `static/uploads/` with a timestamped, sanitized filename.
  - Saves each submission as a row in the `applications` table with a timestamp and a `status`
    field (defaults to `New`) so it's ready for an admin workflow later.
  - Returns JSON so the page can show the success message without a reload:
    *"Thank you! Your request has been received. Jugno Overseas Consultancy will contact you soon."*
- `GET /api/applications?key=YOUR_ADMIN_KEY` — lists submitted applications as JSON. This is an
  **admin-ready** endpoint, not a public one: it only responds if the `ADMIN_KEY` environment
  variable is set and the request supplies the matching `key`. Treat this as a starting point —
  before using it for real admin work, put it behind proper authentication (e.g. a login page or
  a hosted admin panel) rather than relying on the key alone.
- `GET /healthz` — simple health check for uptime monitoring / Render.

## 4. Deploying to Render

**Option A — using the included blueprint**
1. Push this project to a GitHub repository.
2. In Render, choose **New → Blueprint** and point it at the repo. Render will read `render.yaml`
   and provision a web service automatically, generating `SECRET_KEY` and `ADMIN_KEY` for you.
3. (Optional, recommended for production) Add a Render PostgreSQL database and uncomment the
   `DATABASE_URL` block in `render.yaml`, or set `DATABASE_URL` manually in the service's
   environment settings so data isn't lost on redeploys (Render's filesystem is ephemeral, so
   SQLite alone is fine for testing but not for durable production data).

**Option B — manual web service**
1. In Render, choose **New → Web Service** and connect the repo.
2. Build command: `pip install -r requirements.txt`
3. Start command: `gunicorn app:app`
4. Add environment variables `SECRET_KEY` and (optionally) `ADMIN_KEY`.
5. Deploy.

## 5. Content and business notes

- All service and page copy is written strictly as **consultancy / facilitation** language.
  The site does not claim government, HEC, IBCC, MoFA, embassy, or UAE government affiliation
  anywhere, per the brief.
- The footer includes the required disclaimer that fees, timelines and approvals are decided by
  the relevant authorities, and that visa issuance or approval is not guaranteed.
- WhatsApp links use the international format `923231581509` with a pre-filled message, and
  appear in the header, hero, application section, contact section, and as a floating
  bottom-right button on every page.
- The map section embeds a Google Maps view for the office address
  (**G-7/2 Blue Area, Islamabad, Pakistan**) without inventing exact coordinates.
- `static/images/og-cover.svg` is an SVG Open Graph image. Some platforms (e.g. WhatsApp/iMessage
  previews) render social-share images more reliably as PNG/JPG — if you need broader preview
  compatibility, export this SVG to a 1200×630 PNG and update the `og:image` tag in
  `templates/index.html` accordingly.

## 6. Next steps you may want before going fully live

- Add authentication (not just a shared key) to the `/api/applications` admin endpoint, or build
  a small admin page around it.
- Attach a persistent PostgreSQL database on Render (see above) so applications and uploaded
  documents survive redeploys — note uploaded files under `static/uploads/` are also on the
  ephemeral filesystem, so for production consider object storage (e.g. S3-compatible storage)
  for uploads.
- Point a custom domain (e.g. `jugnooverseas.com`) at the Render service and enable HTTPS
  (Render provides this automatically for custom domains).
- Connect a real form-notification channel (email/SMS/WhatsApp Business API) so new applications
  trigger an alert instead of relying only on checking the database.
