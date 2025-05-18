import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import ScheduleTable, { ScheduleEntry } from './ScheduleTable';

const OCRUpload: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
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
      const { data: { text } } = await Tesseract.recognize(image, 'eng');
      setText(text);
      setEntries(parseScheduleText(text));
    } catch (err) {
      console.error('OCR error:', err);
      setText('Error processing image');
    }
    setIsProcessing(false);
  };

  const parseScheduleText = (text: string): ScheduleEntry[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const dayLine = lines.find(line => daysList.every(day => line.includes(day)));
    const detectedDays = dayLine?.split(/\s+/).filter(d => daysList.includes(d)) ?? [];
  
    const entries: ScheduleEntry[] = [];
    let currentCourse = '';
    let currentDays: string[] = [];
    let currentLocation = '';
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
  
      // Match something like: STAT 453 (LEC 001)
      const courseMatch = line.match(/([A-Z ]+\d{3,})\s*\(.*?\)/);
      if (courseMatch) {
        currentCourse = courseMatch[1].trim();
        continue;
      }
  
      // Match times: 8:00AM–9:15AM or 8:00 AM - 9:15 AM
      const timeMatch = line.match(/(\d{1,2}:\d{2}\s?[AP]M)\s*[-–]\s*(\d{1,2}:\d{2}\s?[AP]M)/i);
      if (timeMatch) {
        const [_, start, end] = timeMatch;
        const possibleLoc = lines[i + 1] ?? '';
        const locationMatch = possibleLoc.match(/[A-Z]{2,} ?\d{0,3}/);
        currentLocation = locationMatch ? locationMatch[0] : '';
  
        entries.push({
          course: currentCourse,
          days: [...detectedDays], // can improve this further
          startTime: start.trim(),
          endTime: end.trim(),
          location: currentLocation
        });
        continue;
      }
    }
  
    return entries;
  };
  // Function to handle entry edit  

  const handleEntryEdit = (index: number, updated: ScheduleEntry) => {
    const copy = [...entries];
    copy[index] = updated;
    setEntries(copy);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-2">Upload Schedule Image</h2>
      <input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
      <button
        onClick={handleProcessImage}
        disabled={!image || isProcessing}
        className="ml-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        {isProcessing ? 'Processing...' : 'Run OCR'}
      </button>

      <textarea
        value={text}
        readOnly
        rows={10}
        className="mt-4 w-full border p-2 font-mono"
        placeholder="Extracted text"
      />

      {entries.length > 0 && (
        <ScheduleTable entries={entries} onEdit={handleEntryEdit} />
      )}
    </div>
  );
};

export default OCRUpload;
