from flask import Flask, request, jsonify
import os, base64, pathlib

app = Flask(__name__)
DUMP_DIR = pathlib.Path("dump")
DUMP_DIR.mkdir(exist_ok=True)

@app.route("/", methods=["GET"])
def index():
    files = list(DUMP_DIR.rglob("*.lua"))
    return jsonify({"status": "ok", "files": len(files)})

@app.route("/upload", methods=["POST"])
def upload():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "no data"}), 400

    name = data.get("name", "unknown.lua")
    content = data.get("content", "")

    # content puede ser texto plano o base64
    if data.get("encoding") == "base64":
        try:
            content = base64.b64decode(content)
            mode = "wb"
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    else:
        content = content.encode("utf-8")
        mode = "wb"

    # Sanitizar path
    safe = name.replace("..", "").lstrip("/")
    dest = DUMP_DIR / safe
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(content)

    return jsonify({"ok": True, "saved": safe})

@app.route("/files", methods=["GET"])
def files():
    result = []
    for f in DUMP_DIR.rglob("*"):
        if f.is_file():
            result.append(str(f.relative_to(DUMP_DIR)))
    return jsonify({"files": result})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
