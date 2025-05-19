import cv2
import numpy as np
import pytesseract
from PIL import Image
import tempfile
import os

def parse_schedule(file):
    try:
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            file.save(tmp.name)
            image = cv2.imread(tmp.name)

        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Apply binary thresholding
        _, binary = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)

        # Detect horizontal and vertical lines
        horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1))
        detect_horizontal = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)

        vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 25))
        detect_vertical = cv2.morphologyEx(binary, cv2.MORPH_OPEN, vertical_kernel, iterations=2)

        # Combine horizontal and vertical lines to create a table mask
        table_mask = cv2.add(detect_horizontal, detect_vertical)

        # Find contours
        contours, _ = cv2.findContours(table_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        results = []

        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            if w < 50 or h < 20:
                continue
            roi = image[y:y+h, x:x+w]
            text = pytesseract.image_to_string(roi)

            print(f"OCR result (x={x}, y={y}):", repr(text))  # <- this must be indented exactly like this

            if text.strip():
                results.append({
                    "text": text.strip(),
                    "x": int(x), "y": int(y),
                    "width": int(w), "height": int(h)
                })

        # Clean up the temporary file
        os.remove(tmp.name)

        return {"schedule": results}

    except Exception as e:
        return {"error": f"Failed to parse schedule: {str(e)}"}