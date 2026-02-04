import os
import json
from functools import wraps

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
)
from werkzeug.utils import secure_filename

# -----------------------------------------------------------------------------
# Flask setup
# -----------------------------------------------------------------------------

app = Flask(__name__, template_folder="templates", static_folder="static")

# Secret key for session handling (change this to something unique for real use)
app.secret_key = "super-secret-fifth-format-key"

# Simple demo access code for temp sharing
ACCESS_CODE = "wolf123"

# -----------------------------------------------------------------------------
# File upload configuration
# -----------------------------------------------------------------------------

UPLOAD_SUBFOLDER = "experiences"  # under /static
UPLOAD_FOLDER = os.path.join(app.static_folder, UPLOAD_SUBFOLDER)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"mp3", "wav", "ogg", "m4a"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# -----------------------------------------------------------------------------
# Persistence: experiences.json for uploaded Experiences
# -----------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXPERIENCES_JSON = os.path.join(BASE_DIR, "experiences.json")


def load_uploaded_experiences():
    """Load non-base (uploaded) Experiences from JSON on disk."""
    if not os.path.exists(EXPERIENCES_JSON):
        return []

    try:
        with open(EXPERIENCES_JSON, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
        return []
    except (json.JSONDecodeError, OSError):
        return []


def save_uploaded_experiences(uploaded_list):
    """Save only uploaded Experiences to JSON (base Experiences are not stored here)."""
    try:
        with open(EXPERIENCES_JSON, "w", encoding="utf-8") as f:
            json.dump(uploaded_list, f, indent=2, ensure_ascii=False)
    except OSError:
        # Failing to save shouldn't crash the app.
        pass


# -----------------------------------------------------------------------------
# Seed Experiences – your 5 core tracks
# -----------------------------------------------------------------------------
# Add a "package" field so they belong to the same core EXP package.

base_experiences = [
    {
        "id": "EXP-01",
        "title": "Even Once",
        "author": "W. Wolf",
        "voice": "Kersali",
        "file": "Even Once.mp3",
        "lyrics": "Even Once.txt",
        "vibe": "Dark • Trance • Slow Burn",
        "package": "EXP – Fifth Format Core",
    },
    {
        "id": "EXP-02",
        "title": "I Do",
        "author": "W. Wolf",
        "voice": "Kersali",
        "file": "I do.mp3",
        "lyrics": "I do.txt",
        "vibe": "Intimate • Minimal • Pulse",
        "package": "EXP – Fifth Format Core",
    },
    {
        "id": "EXP-03",
        "title": "Other Day",
        "author": "W. Wolf",
        "voice": "Kersali",
        "file": "Other Day.mp3",
        "lyrics": "Other Day.txt",
        "vibe": "Atmospheric • Late Night",
        "package": "EXP – Fifth Format Core",
    },
    {
        "id": "EXP-04",
        "title": "Almost Real",
        "author": "W. Wolf",
        "voice": "Kersali",
        "file": "Almost Real.mp3",
        "lyrics": "Almost Real.txt",
        "vibe": "Surreal • Floating",
        "package": "EXP – Fifth Format Core",
    },
    {
        "id": "EXP-05",
        "title": "Drift Water",
        "author": "W. Wolf",
        "voice": "Kersali",
        "file": "Drift Water.mp3",
        "lyrics": "Drift Water.txt",
        "vibe": "Fluid • Hypnotic",
        "package": "EXP – Fifth Format Core",
    },
]


def is_base_experience(exp_id: str) -> bool:
    return any(b["id"] == exp_id for b in base_experiences)


# Load uploads from JSON and build full list
experiences = base_experiences + load_uploaded_experiences()


def get_uploaded_experiences():
    """Return just the non-base experiences from the global experiences list."""
    return [e for e in experiences if not is_base_experience(e.get("id", ""))]


# -----------------------------------------------------------------------------
# EXP id generator
# -----------------------------------------------------------------------------

def next_experience_id():
    """
    Find the next available EXP-XX id based on existing Experiences.
    Ensures uniqueness and keeps numbering stable.
    """
    max_n = 0
    for e in experiences:
        eid = str(e.get("id", ""))
        if eid.startswith("EXP-"):
            try:
                n = int(eid[4:])
            except ValueError:
                continue
            if n > max_n:
                max_n = n
    return f"EXP-{max_n + 1:02d}"


# -----------------------------------------------------------------------------
# Rebuild helper (used by Config page)
# -----------------------------------------------------------------------------

def rebuild_uploaded_from_disk():
    """
    Disaster-recovery helper:
    - Clears all uploaded Experiences in memory
    - Scans static/experiences for audio files
    - Rebuilds uploaded Experiences with basic metadata
    - Saves them back to experiences.json
    """
    global experiences

    # Start fresh: keep base Experiences, wipe uploads in memory
    experiences = base_experiences.copy()

    if not os.path.exists(UPLOAD_FOLDER):
        save_uploaded_experiences([])
        return

    # For each audio file under /static/experiences, create a recovered Experience
    for name in sorted(os.listdir(UPLOAD_FOLDER)):
        if not allowed_file(name):
            continue

        original_base, _ = os.path.splitext(name)
        new_id = next_experience_id()

        title = (
            original_base.replace("_", " ").replace("-", " ").title()
            if original_base
            else new_id
        )

        lyrics_rel = f"{UPLOAD_SUBFOLDER}/{original_base}.txt"

        new_exp = {
            "id": new_id,
            "title": title,
            "author": "Recovered Author",
            "voice": "Recovered Voice",
            "file": f"{UPLOAD_SUBFOLDER}/{name}",
            "lyrics": lyrics_rel,
            "vibe": "Recovered from disk",
            "package": "EXP – Recovered Experiences",
        }

        experiences.append(new_exp)

    # Persist recovered uploads
    save_uploaded_experiences(get_uploaded_experiences())


# -----------------------------------------------------------------------------
# Simple access-code gate
# -----------------------------------------------------------------------------

def require_code(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        if session.get("access_granted"):
            return view_func(*args, **kwargs)
        return redirect(url_for("gate"))

    return wrapper


@app.route("/gate", methods=["GET", "POST"])
def gate():
    """Small gate page that asks for an access code."""
    error = None
    if request.method == "POST":
        code = request.form.get("code", "").strip()
        if code == ACCESS_CODE:
            session["access_granted"] = True
            return redirect(url_for("home"))
        else:
            error = "Invalid access code"
    return render_template("gate.html", error=error)


# -----------------------------------------------------------------------------
# Main pages
# -----------------------------------------------------------------------------

@app.route("/", methods=["GET"])
@require_code
def home():
    """Main Fifth Format Experiences page."""
    authors = sorted({exp["author"] for exp in experiences})
    voices = sorted({exp["voice"] for exp in experiences})

    # Group experiences by "package"
    packages = []
    package_map = {}

    for exp in experiences:
        pkg_name = exp.get("package") or "Shared Experiences"

        if pkg_name not in package_map:
            package_map[pkg_name] = {
                "package": pkg_name,
                "author": exp.get("author", "Unknown Author"),
                "voice": exp.get("voice", "Unknown Voice"),
                "experiences": [],
            }
            packages.append(package_map[pkg_name])

        package_map[pkg_name]["experiences"].append(exp)

    return render_template(
        "index.html",
        experiences=experiences,
        packages=packages,
        authors=authors,
        voices=voices,
    )


@app.route("/forge", methods=["GET"])
@require_code
def forge():
    """Lyric-to-Experience Forge demo UI."""
    return render_template("forge.html")


# -----------------------------------------------------------------------------
# Config page
# -----------------------------------------------------------------------------

@app.route("/config", methods=["GET", "POST"])
@require_code
def config_page():
    """
    Simple config/maintenance panel:
    - Show counts
    - Button to force-save uploads to JSON
    - Button to rebuild uploads from disk if JSON is lost/corrupt
    """
    global experiences

    message = None

    if request.method == "POST":
        action = request.form.get("action")
        if action == "save":
            # Force save current uploaded Experiences to JSON
            save_uploaded_experiences(get_uploaded_experiences())
            message = "Uploaded Experiences saved to experiences.json."
        elif action == "rebuild":
            # Rebuild from audio files on disk
            rebuild_uploaded_from_disk()
            message = "Rebuilt uploaded Experiences from audio files on disk."

    info = {
        "total_experiences": len(experiences),
        "base_experiences": len(base_experiences),
        "uploaded_experiences": len(get_uploaded_experiences()),
        "upload_folder": UPLOAD_FOLDER,
        "experiences_json": EXPERIENCES_JSON,
        "experiences_json_exists": os.path.exists(EXPERIENCES_JSON),
    }

    return render_template("config.html", info=info, message=message)


# -----------------------------------------------------------------------------
# Experience Player Page
# -----------------------------------------------------------------------------

@app.route("/experience/<exp_id>", methods=["GET"])
@require_code
def experience_player(exp_id):
    """Dedicated Fifth Format Experience Playback Page."""
    exp = next((e for e in experiences if e["id"] == exp_id), None)

    if not exp:
        return redirect(url_for("home"))

    return render_template("experience.html", exp=exp)


# -----------------------------------------------------------------------------
# Upload new Experience
# -----------------------------------------------------------------------------

@app.route("/upload", methods=["POST"])
@require_code
def upload():
    """Upload a new Experience (audio file + metadata)."""
    global experiences

    file = request.files.get("file")
    if not file or file.filename == "":
        return redirect(url_for("home"))

    if not allowed_file(file.filename):
        return redirect(url_for("home"))

    # Original filename (for better title & lyrics path)
    original_name = file.filename
    original_base, _ = os.path.splitext(original_name)  # e.g. "These days"

    # Generate a unique EXP id first
    new_id = next_experience_id()

    # Use that id as the saved audio filename to avoid collisions
    _, ext = os.path.splitext(file.filename)
    ext = (ext or ".mp3").lower()
    filename = secure_filename(f"{new_id}{ext}")  # e.g. EXP-06.mp3

    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)

    # For title, build something pretty from original base
    readable_name = (
        original_base.replace("_", " ").replace("-", " ").title()
        if original_base
        else "Untitled Experience"
    )

    title = request.form.get("title", "").strip() or readable_name
    author = request.form.get("author", "").strip() or "Guest Author"
    voice = request.form.get("voice", "").strip() or "Guest Voice"

    # Experience package
    package = request.form.get("package", "").strip()
    if not package:
        if author != "Guest Author":
            package = f"EXP – {author}'s Experiences"
        else:
            package = "EXP – Shared Experiences"

    # Lyrics: look for static/experiences/<original_base>.txt
    lyrics_rel = f"{UPLOAD_SUBFOLDER}/{original_base}.txt"

    new_exp = {
        "id": new_id,
        "title": title,
        "author": author,
        "voice": voice,
        "file": f"{UPLOAD_SUBFOLDER}/{filename}",  # audio file (EXP-06.mp3 etc.)
        "lyrics": lyrics_rel,                      # lyrics text file
        "vibe": "Shared by the community",
        "package": package,
    }

    experiences.append(new_exp)

    # Persist only uploaded experiences to JSON
    uploaded_only = get_uploaded_experiences()
    save_uploaded_experiences(uploaded_only)

    return redirect(url_for("home"))


# -----------------------------------------------------------------------------
# Delete uploaded Experience (non-base only)
# -----------------------------------------------------------------------------

@app.route("/experience/<exp_id>/delete", methods=["POST"])
@require_code
def delete_experience(exp_id):
    """Delete an uploaded (non-base) experience and its audio/lyrics files."""
    global experiences

    # Do not allow deleting seeded / base experiences
    if is_base_experience(exp_id):
        return redirect(url_for("home"))

    exp = next((e for e in experiences if e["id"] == exp_id), None)
    if not exp:
        return redirect(url_for("home"))

    # Build full paths to audio and lyrics
    audio_path = os.path.join(app.static_folder, exp["file"])
    lyrics_path = os.path.join(app.static_folder, exp["lyrics"])

    for path in (audio_path, lyrics_path):
        try:
            if os.path.exists(path):
                os.remove(path)
        except OSError:
            # Don't crash if file missing or cannot be deleted
            pass

    # Remove from in-memory list
    experiences = [e for e in experiences if e["id"] != exp_id]

    # Persist updated uploads to JSON
    uploaded_only = get_uploaded_experiences()
    save_uploaded_experiences(uploaded_only)

    return redirect(url_for("home"))


# -----------------------------------------------------------------------------
# Debug / entrypoint
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)
