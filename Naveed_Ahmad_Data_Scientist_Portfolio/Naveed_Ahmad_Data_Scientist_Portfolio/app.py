import os
from flask import Flask, render_template, send_from_directory

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "change-this-in-production")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/download-cv")
def download_cv():
    return send_from_directory(
        os.path.join(app.root_path, "cv"), "Naveed_Ahmad DS_CV.pdf", as_attachment=True
    )


@app.route("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
