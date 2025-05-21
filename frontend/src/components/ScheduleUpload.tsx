import React, { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { uploadImageForSchedule, ApiError, ParseResponse } from '../api';
import ScheduleTable from './ScheduleTable';
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

  const processScheduleData = (data: ParseResponse): ProcessedEntry[] => {
    return data.schedule.map(entry => ({
      ...entry,
      course: entry.text,
      days: [],
      startTime: '',
      endTime: '',
      location: '',
    }));
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
      }}
    >
      <div className="max-w-4xl mx-auto">
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
              or drag and drop your schedule image here
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
          <ScheduleTable entries={entries} onEdit={handleEdit} />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ScheduleUpload;
