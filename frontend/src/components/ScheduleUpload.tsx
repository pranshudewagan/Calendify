import React, { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { uploadImageForSchedule, ApiError, ParseResponse, ScheduleEntry } from '../api';
import ScheduleTable from './ScheduleTable';
import Calendar from './Calendar';
import { ProcessedEntry } from '../types';

const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div className="text-center p-4 bg-red-50 rounded-lg">
      <h3 className="text-red-800 font-bold mb-2">Something went wrong:</h3>
      <pre className="text-sm text-red-600 mb-4">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
};

const ScheduleUpload: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [entries, setEntries] = useState<ProcessedEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [rawBlocks, setRawBlocks] = useState<string[]>([]);

  // Dynamically determine day columns based on block positions
  function getDayBoundaries(blocks: { position: { x: number } }[]): { minX: number; maxX: number }[] {
    // Get all x positions, sort, and find clusters (columns)
    const xs = blocks.map(b => b.position.x).sort((a, b) => a - b);
    // Use k-means or simple clustering: assume 5 columns, split by gaps
    // For simplicity, find 5 largest gaps between sorted xs
    const gaps = xs.slice(1).map((x, i) => x - xs[i]);
    const gapIndices = gaps
      .map((gap, i) => ({ gap, i }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 4) // 5 columns = 4 gaps
      .map(g => g.i + 1)
      .sort((a, b) => a - b);
    const boundaries = [0, ...gapIndices, xs.length];
    const columns: { minX: number; maxX: number }[] = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
      const colXs = xs.slice(boundaries[i], boundaries[i + 1]);
      if (colXs.length > 0) {
        columns.push({ minX: Math.min(...colXs), maxX: Math.max(...colXs) });
      }
    }
    return columns;
  }

  // Helper to normalize time to 24-hour format
  function normalizeTimeTo24h(time: string): string {
    // Accepts '1:20PM', '01:20 PM', '13:20', etc. Returns 'HH:MM' in 24h format.
    let t = time.trim().toUpperCase();
    const match = t.match(/^(\d{1,2}):(\d{2})\s*([AP]M)?$/);
    if (!match) return '';
    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const ampm = match[3];
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }

  const processScheduleData = (data: ParseResponse): ProcessedEntry[] => {
    if (!Array.isArray(data.schedule)) return [];
    const blocks = data.schedule;
    // Dynamically determine day columns
    const columns = getDayBoundaries(blocks);
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    // Map each block to a day
    function getDayFromX(x) {
      for (let i = 0; i < columns.length; i++) {
        if (x >= columns[i].minX && x <= columns[i].maxX) return DAYS[i] || `Day${i+1}`;
      }
      return '?';
    }
    const entries: ProcessedEntry[] = [];
    blocks.forEach(block => {
      const lines = block.text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return; // Need at least course and time
      const course = lines[0];
      // Parse time slot (e.g., 1:20PM-2:10PM or 11:00 AM-11:50 AM)
      const timeLine = lines[1];
      let startTime = '', endTime = '';
      const timeMatch = timeLine.match(/(\d{1,2}:\d{2}\s*[AP]M?)\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M?)/i);
      if (timeMatch) {
        startTime = normalizeTimeTo24h(timeMatch[1]);
        endTime = normalizeTimeTo24h(timeMatch[2]);
      }
      // Optionally, convert to 24h format if needed by your UI
      entries.push({
        course,
        section: '',
        days: [getDayFromX(block.position.x)],
        startTime,
        endTime,
        location: '',
        text: block.text,
        position: block.position,
      });
    });
    return entries;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImage(file);
  };

  const handleUpload = async () => {
    if (!image) return;
    
    setLoading(true);
    try {
      const result = await uploadImageForSchedule(image);
      
      if (result.warning) {
        toast(result.warning, { icon: '⚠️' });
      }
      
      const processedEntries = processScheduleData(result);
      setEntries(processedEntries);
      console.log('Parsed Entries:', processedEntries);
      toast.success('Schedule parsed successfully!');
      
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(`API Error: ${error.message}`);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index: number, updated: ProcessedEntry) => {
    const updatedList = [...entries];
    updatedList[index] = updated;
    setEntries(updatedList);
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        setImage(null);
        setEntries([]);
        setRawBlocks([]);
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="mb-4">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Select Image
            </label>
            <p className="mt-2 text-sm text-gray-600">
              or drag and drop your schedule image here bruh
            </p>
          </div>
          
          {image && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Selected: {image.name}</p>
              <button
                onClick={handleUpload}
                disabled={loading}
                className={`mt-2 px-4 py-2 rounded text-white ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? 'Processing...' : 'Upload and Process'}
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="mb-6">
            <Skeleton count={5} height={40} className="mb-2" />
          </div>
        )}

        {entries.length > 0 && !loading && (
          <div className="space-y-8">
            <Calendar entries={entries} />
            <ScheduleTable entries={entries} onEdit={handleEdit} />
          </div>
        )}
        {entries.length === 0 && rawBlocks.length > 0 && !loading && (
          <div className="bg-white rounded-lg shadow p-4 mt-8">
            <h3 className="text-lg font-semibold mb-2">Raw Extracted Text Blocks</h3>
            <ul className="list-disc pl-6">
              {rawBlocks.map((block, idx) => (
                <li key={idx} className="mb-1 text-gray-700">{block}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ScheduleUpload;
