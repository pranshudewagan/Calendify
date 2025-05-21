from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
import os
from config import Config
from parser import parse_schedule
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object(Config)

# Initialize CORS
CORS(app, supports_credentials=True, origins=Config.CORS_ORIGINS)

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per day", "10 per minute"]
)

# Create upload folder if it doesn't exist
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "File is too large. Maximum size is 5MB"}), 413

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({"error": f"Rate limit exceeded. {e.description}"}), 429

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Welcome to the Calendify API",
        "version": "1.0",
        "endpoints": {
            "/parse": "POST - Upload and parse a schedule image"
        }
    })

@app.route("/parse", methods=["POST"])
@limiter.limit("10 per minute")
def parse():
    try:
        logger.info("Received request to /parse")
        
        # Check if file exists in request
        if 'file' not in request.files:
            logger.warning("No file part in request")
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        
        # Check if file was selected
        if file.filename == '':
            logger.warning("No file selected")
            return jsonify({"error": "No file selected"}), 400
        
        # Validate file type
        if not Config.allowed_file(file.filename):
            logger.warning(f"Invalid file type: {file.filename}")
            return jsonify({"error": "Invalid file type. Allowed types: png, jpg, jpeg"}), 400
        
        # Secure the filename
        filename = secure_filename(file.filename)
        filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
        
        # Save file temporarily
        file.save(filepath)
        
        try:
            # Process the image
            result = parse_schedule(filepath)
            
            # Check if processing was successful
            if "error" in result:
                logger.error(f"Error processing image: {result['error']}")
                return jsonify(result), 400
                
            return jsonify(result)
            
        finally:
            # Clean up - remove the temporary file
            if os.path.exists(filepath):
                os.remove(filepath)
                
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG)
    #cursor comment