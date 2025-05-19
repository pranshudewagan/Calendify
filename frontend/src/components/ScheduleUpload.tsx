import React, { useState } from 'react';
import { uploadImageForSchedule } from '../api';
import ScheduleTable, { ScheduleEntry } from './ScheduleTable';

const ScheduleUpload: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
  };

  const handleUpload = async () => {
    if (!image) return;
    setLoading(true);
    try {
      console.log('Uploading image:', image);
      const formData = new FormData();
      formData.append('file', image);
  
      const response = await fetch('http://localhost:5000/parse', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend returned error:', response.status, errorText);
        throw new Error(`Backend error ${response.status}`);
      }
  
      const result = await response.json();
      console.log('Parsed entries:', result);
  
      const parsed = result.entries.map((block: any) => ({
        course: block.text,
        days: [],
        startTime: '',
        endTime: '',
        location: '',
      }));
      setEntries(parsed);
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('Failed to parse schedule image.');
    }
    setLoading(false);
  };  

  const handleEdit = (index: number, updated: ScheduleEntry) => {
    const updatedList = [...entries];
    updatedList[index] = updated;
    setEntries(updatedList);
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Upload Class Schedule</h2>
      <input type="file" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        disabled={!image || loading}
        className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? 'Processing...' : 'Upload'}
      </button>

      {entries.length > 0 && (
        <ScheduleTable entries={entries} onEdit={handleEdit} />
      )}
    </div>
  );
};

export default ScheduleUpload;
