import cv2
import numpy as np
import pytesseract
from PIL import Image
import logging
from config import Config
import os

logger = logging.getLogger(__name__)

class ImageProcessingError(Exception):
    """Custom exception for image processing errors"""
    pass

def enhance_image(image):
    """Enhance image quality for better OCR results"""
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply adaptive thresholding
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 11, 2
        )
        
        # Noise removal
        kernel = np.ones((1, 1), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
        
        # Dilation to make text clearer
        binary = cv2.dilate(binary, kernel, iterations=1)
        
        return binary
    except Exception as e:
        raise ImageProcessingError(f"Failed to enhance image: {str(e)}")

def detect_table_structure(binary_image):
    """Detect table structure in the image"""
    try:
        # Detect horizontal lines
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
        detect_horizontal = cv2.morphologyEx(binary_image, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
        
        # Detect vertical lines
        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
        detect_vertical = cv2.morphologyEx(binary_image, cv2.MORPH_OPEN, vertical_kernel, iterations=2)
        
        # Combine horizontal and vertical lines
        table_mask = cv2.add(detect_horizontal, detect_vertical)
        
        return table_mask
    except Exception as e:
        raise ImageProcessingError(f"Failed to detect table structure: {str(e)}")

def extract_text_from_roi(image, x, y, w, h):
    """Extract text from a region of interest using OCR"""
    try:
        roi = image[y:y+h, x:x+w]
        
        # Additional preprocessing for OCR
        roi_enhanced = cv2.resize(roi, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        
        # Configure tesseract parameters
        custom_config = r'--oem 3 --psm 6'
        
        # Perform OCR
        text = pytesseract.image_to_string(roi_enhanced, config=custom_config)
        
        return text.strip()
    except Exception as e:
        logger.warning(f"Failed to extract text from ROI: {str(e)}")
        return ""

def parse_schedule(filepath):
    """Main function to parse schedule from image"""
    try:
        # Check if file exists
        if not os.path.exists(filepath):
            raise FileNotFoundError("Image file not found")
            
        # Read image
        image = cv2.imread(filepath)
        if image is None:
            raise ImageProcessingError("Failed to read image file")
            
        # Check image dimensions
        if image.shape[0] < 100 or image.shape[1] < 100:
            raise ImageProcessingError("Image dimensions too small")
            
        # Process image
        binary = enhance_image(image)
        table_mask = detect_table_structure(binary)
        
        # Find contours
        contours, _ = cv2.findContours(table_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Sort contours by position (top to bottom, left to right)
        contours = sorted(contours, key=lambda c: (cv2.boundingRect(c)[1], cv2.boundingRect(c)[0]))
        
        results = []
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            
            # Filter out small boxes
            if w < 50 or h < 20:
                continue
                
            # Extract text from cell
            text = extract_text_from_roi(image, x, y, w, h)
            
            if text:
                results.append({
                    "text": text,
                    "position": {
                        "x": int(x),
                        "y": int(y),
                        "width": int(w),
                        "height": int(h)
                    }
                })
        
        if not results:
            logger.warning("No text was extracted from the image")
            return {"warning": "No text could be extracted from the image", "schedule": []}
            
        return {"schedule": results}
        
    except FileNotFoundError as e:
        logger.error(f"File error: {str(e)}")
        return {"error": "File not found"}
    except ImageProcessingError as e:
        logger.error(f"Image processing error: {str(e)}")
        return {"error": f"Image processing failed: {str(e)}"}
    except Exception as e:
        logger.error(f"Unexpected error in parse_schedule: {str(e)}", exc_info=True)
        return {"error": "An unexpected error occurred while processing the image"}