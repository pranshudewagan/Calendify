from flask import Flask, request, jsonify
from flask_cors import CORS
from parser import parse_schedule

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

@app.route("/", methods=["GET"])
def home():
    return "<h1>Welcome to the Calendify API</h1><p>Use the /parse endpoint to upload a schedule image.</p>"

@app.route("/parse", methods=["POST"])
def parse():
    print("📥 Received request to /parse")
    print("Files received:", request.files)

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    result = parse_schedule(file)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True, port=5000)