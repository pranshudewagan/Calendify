import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

const OCRUpload: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const handleProcessImage = async () => {
    if (!image) return;
    setIsProcessing(true);
    try {
      const { data: { text } } = await Tesseract.recognize(image, 'eng', {
        logger: m => console.log(m), // optional
      });
      setText(text);
    } catch (err) {
      console.error('OCR error:', err);
      setText('Error processing image');
    }
    setIsProcessing(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-2">Upload Schedule Image</h2>
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={handleProcessImage}
        disabled={!image || isProcessing}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : 'Run OCR'}
      </button>
      <textarea
        value={text}
        readOnly
        rows={10}
        className="mt-4 w-full border p-2 font-mono"
        placeholder="Extracted text will appear here"
      />
    </div>
  );
};

export default OCRUpload;
