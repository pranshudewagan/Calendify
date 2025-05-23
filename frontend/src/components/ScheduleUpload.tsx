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
  const [groupedTableEntries, setGroupedTableEntries] = useState<ProcessedEntry[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [semesterStart, setSemesterStart] = useState('2025-09-03');
  const [semesterEnd, setSemesterEnd] = useState('2025-12-10');
  const [timeZone, setTimeZone] = useState('America/Chicago');

  // List of IANA time zones ordered by GMT offset
  const timeZones = [
    { value: 'Pacific/Midway', label: '(GMT-11:00) Midway Island (Pacific/Midway)' },
    { value: 'Pacific/Honolulu', label: '(GMT-10:00) Hawaii (Pacific/Honolulu)' },
    { value: 'America/Anchorage', label: '(GMT-09:00) Alaska (America/Anchorage)' },
    { value: 'America/Los_Angeles', label: '(GMT-08:00) Pacific Time (America/Los_Angeles)' },
    { value: 'America/Tijuana', label: '(GMT-08:00) Tijuana (America/Tijuana)' },
    { value: 'America/Denver', label: '(GMT-07:00) Mountain Time (America/Denver)' },
    { value: 'America/Phoenix', label: '(GMT-07:00) Arizona (America/Phoenix)' },
    { value: 'America/Chihuahua', label: '(GMT-07:00) Chihuahua (America/Chihuahua)' },
    { value: 'America/Chicago', label: '(GMT-06:00) Central Time (America/Chicago)' },
    { value: 'America/Regina', label: '(GMT-06:00) Saskatchewan (America/Regina)' },
    { value: 'America/Mexico_City', label: '(GMT-06:00) Mexico City (America/Mexico_City)' },
    { value: 'America/New_York', label: '(GMT-05:00) Eastern Time (America/New_York)' },
    { value: 'America/Indiana/Indianapolis', label: '(GMT-05:00) Indiana (America/Indiana/Indianapolis)' },
    { value: 'America/Bogota', label: '(GMT-05:00) Bogota (America/Bogota)' },
    { value: 'America/Caracas', label: '(GMT-04:30) Caracas (America/Caracas)' },
    { value: 'America/Halifax', label: '(GMT-04:00) Atlantic Time (America/Halifax)' },
    { value: 'America/La_Paz', label: '(GMT-04:00) La Paz (America/La_Paz)' },
    { value: 'America/Santiago', label: '(GMT-04:00) Santiago (America/Santiago)' },
    { value: 'America/St_Johns', label: '(GMT-03:30) Newfoundland (America/St_Johns)' },
    { value: 'America/Argentina/Buenos_Aires', label: '(GMT-03:00) Buenos Aires (America/Argentina/Buenos_Aires)' },
    { value: 'America/Sao_Paulo', label: '(GMT-03:00) Sao Paulo (America/Sao_Paulo)' },
    { value: 'Atlantic/South_Georgia', label: '(GMT-02:00) South Georgia (Atlantic/South_Georgia)' },
    { value: 'Atlantic/Azores', label: '(GMT-01:00) Azores (Atlantic/Azores)' },
    { value: 'Atlantic/Cape_Verde', label: '(GMT-01:00) Cape Verde (Atlantic/Cape_Verde)' },
    { value: 'Europe/London', label: '(GMT+00:00) London (Europe/London)' },
    { value: 'UTC', label: '(GMT+00:00) UTC' },
    { value: 'Africa/Casablanca', label: '(GMT+00:00) Casablanca (Africa/Casablanca)' },
    { value: 'Europe/Berlin', label: '(GMT+01:00) Berlin (Europe/Berlin)' },
    { value: 'Europe/Paris', label: '(GMT+01:00) Paris (Europe/Paris)' },
    { value: 'Europe/Rome', label: '(GMT+01:00) Rome (Europe/Rome)' },
    { value: 'Europe/Amsterdam', label: '(GMT+01:00) Amsterdam (Europe/Amsterdam)' },
    { value: 'Europe/Prague', label: '(GMT+01:00) Prague (Europe/Prague)' },
    { value: 'Europe/Athens', label: '(GMT+02:00) Athens (Europe/Athens)' },
    { value: 'Europe/Helsinki', label: '(GMT+02:00) Helsinki (Europe/Helsinki)' },
    { value: 'Europe/Istanbul', label: '(GMT+03:00) Istanbul (Europe/Istanbul)' },
    { value: 'Europe/Moscow', label: '(GMT+03:00) Moscow (Europe/Moscow)' },
    { value: 'Asia/Jerusalem', label: '(GMT+02:00) Jerusalem (Asia/Jerusalem)' },
    { value: 'Asia/Baghdad', label: '(GMT+03:00) Baghdad (Asia/Baghdad)' },
    { value: 'Asia/Tehran', label: '(GMT+03:30) Tehran (Asia/Tehran)' },
    { value: 'Asia/Dubai', label: '(GMT+04:00) Dubai (Asia/Dubai)' },
    { value: 'Asia/Baku', label: '(GMT+04:00) Baku (Asia/Baku)' },
    { value: 'Asia/Kabul', label: '(GMT+04:30) Kabul (Asia/Kabul)' },
    { value: 'Asia/Karachi', label: '(GMT+05:00) Karachi (Asia/Karachi)' },
    { value: 'Asia/Kolkata', label: '(GMT+05:30) India (Asia/Kolkata)' },
    { value: 'Asia/Kathmandu', label: '(GMT+05:45) Kathmandu (Asia/Kathmandu)' },
    { value: 'Asia/Dhaka', label: '(GMT+06:00) Dhaka (Asia/Dhaka)' },
    { value: 'Asia/Bangkok', label: '(GMT+07:00) Bangkok (Asia/Bangkok)' },
    { value: 'Asia/Hong_Kong', label: '(GMT+08:00) Hong Kong (Asia/Hong_Kong)' },
    { value: 'Asia/Singapore', label: '(GMT+08:00) Singapore (Asia/Singapore)' },
    { value: 'Asia/Tokyo', label: '(GMT+09:00) Tokyo (Asia/Tokyo)' },
    { value: 'Asia/Seoul', label: '(GMT+09:00) Seoul (Asia/Seoul)' },
    { value: 'Australia/Sydney', label: '(GMT+10:00) Sydney (Australia/Sydney)' },
    { value: 'Pacific/Auckland', label: '(GMT+12:00) Auckland (Pacific/Auckland)' },
    { value: 'Pacific/Fiji', label: '(GMT+12:00) Fiji (Pacific/Fiji)' },
    // Add more as needed
  ];

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
    // Debug log for column-to-day mapping
    console.log('Detected columns and day mapping:');
    columns.forEach((col, i) => {
      console.log(`Column ${i}: ${DAYS[i] || `Day${i+1}`} (minX=${col.minX}, maxX=${col.maxX})`);
    });
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
      const course = lines[0]
        .replace(/^[^A-Za-z0-9]+/, '')
        .replace(/\).*/, ')')
        .trim();
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

  // Group entries by (course, startTime, endTime) permutation for the editable table
  function groupEntriesByPermutation(entries: ProcessedEntry[]): ProcessedEntry[] {
    const map = new Map<string, ProcessedEntry>();
    for (const entry of entries) {
      const key = `${entry.course}|${entry.startTime}|${entry.endTime}`;
      if (map.has(key)) {
        // Merge days
        const existing = map.get(key)!;
        existing.days = Array.from(new Set([...existing.days, ...entry.days]));
      } else {
        map.set(key, { ...entry, days: [...entry.days] });
      }
    }
    return Array.from(map.values());
  }

  React.useEffect(() => {
    setGroupedTableEntries(groupEntriesByPermutation(entries));
  }, [entries]);

  // Only update location in groupedTableEntries, not in entries (calendar)
  const handleEdit = (index: number, updated: ProcessedEntry) => {
    setGroupedTableEntries(prev => {
      const updatedList = [...prev];
      updatedList[index] = updated;
      return updatedList;
    });
    // If days or times changed, update main entries (calendar)
    const prevEntry = groupedTableEntries[index];
    if (
      prevEntry.days.join(',') !== updated.days.join(',') ||
      prevEntry.startTime !== updated.startTime ||
      prevEntry.endTime !== updated.endTime
    ) {
      setEntries(currentEntries => {
        // For each entry, if it matches the permutation, update days/times
        let updatedEntries = currentEntries.map(e => {
          if (
            e.course === updated.course &&
            e.startTime === prevEntry.startTime &&
            e.endTime === prevEntry.endTime
          ) {
            // Only keep entries for days that are still selected
            if (updated.days.includes(e.days[0])) {
              return {
                ...e,
                startTime: updated.startTime,
                endTime: updated.endTime,
                days: [e.days[0]],
              };
            } else {
              // Remove this entry if its day is no longer selected
              return null;
            }
          }
          return e;
        }).filter(Boolean) as ProcessedEntry[];
        // Add new entries for days that were toggled ON
        const prevDays = new Set(prevEntry.days);
        const addedDays = updated.days.filter(day => !prevDays.has(day));
        for (const day of addedDays) {
          updatedEntries.push({
            ...updated,
            days: [day],
          });
        }
        return updatedEntries;
      });
    }
  };

  // Helper to get weekday abbreviation for RRULE
  const dayToRRule = {
    'Mon': 'MO',
    'Tue': 'TU',
    'Wed': 'WE',
    'Thu': 'TH',
    'Fri': 'FR',
    'Sat': 'SA',
    'Sun': 'SU',
  };

  // Helper to get the first date for a given weekday on or after a start date
  function getFirstDateForDay(start: string, day: string): string {
    // Parse as local date
    const [year, month, dayOfMonth] = start.split('-').map(Number);
    const date = new Date(year, month - 1, dayOfMonth);
    const target = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(day);
    const current = date.getDay();
    let diff = (target - current + 7) % 7;
    date.setDate(date.getDate() + diff);
    return date.toISOString().slice(0,10);
  }

  // Helper to format date and time for ICS DTSTART/DTEND
  function formatICSTime(date: string, time: string): string {
    // date: '2025-09-03', time: '13:20' => '20250903T132000'
    return date.replace(/-/g, '') + 'T' + time.replace(':', '') + '00';
  }

  function downloadICS() {
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Calendify//EN\n';
    groupedTableEntries.forEach(entry => {
      entry.days.forEach(day => {
        const byday = dayToRRule[day];
        if (!byday) return;
        // For this day, find the first date in the semester
        const firstDay = getFirstDateForDay(semesterStart, day);
        const dtstart = formatICSTime(firstDay, entry.startTime);
        const dtend = formatICSTime(firstDay, entry.endTime);
        // UNTIL should be the last day at 23:59:59 UTC
        const until = semesterEnd.replace(/-/g, '') + 'T235959Z';
        // Debug log for each VEVENT
        console.log(`VEVENT: ${entry.course} | Day: ${day} | DTSTART: ${dtstart} | RRULE: FREQ=WEEKLY;BYDAY=${byday};UNTIL=${until}`);
        ics += 'BEGIN:VEVENT\n';
        ics += `SUMMARY:${entry.course}\n`;
        ics += `DTSTART;TZID=${timeZone}:${dtstart}\n`;
        ics += `DTEND;TZID=${timeZone}:${dtend}\n`;
        ics += `RRULE:FREQ=WEEKLY;BYDAY=${byday};UNTIL=${until}\n`;
        if (entry.location) ics += `LOCATION:${entry.location}\n`;
        ics += 'END:VEVENT\n';
      });
    });
    ics += 'END:VCALENDAR\n';
    // Download as .ics file
    const blob = new Blob([ics.replace(/\n/g, '\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Your Schedule by Calendify.ics';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

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
              ref={fileInputRef}
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
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">Selected: {image.name}</p>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className={`mt-2 px-4 py-2 rounded text-white ml-4 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {loading ? 'Processing...' : 'Upload and Process'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setEntries([]);
                    setRawBlocks([]);
                    setGroupedTableEntries([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                      fileInputRef.current.click();
                    }
                  }}
                  className="mt-2 px-4 py-2 rounded text-white bg-blue-500 hover:bg-blue-700 ml-2"
                >
                  Reupload
                </button>
              </div>
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
            <div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-4">
              <label className="flex flex-col items-center">
                <span className="font-medium mb-1">Semester Start Date</span>
                <input
                  type="date"
                  value={semesterStart}
                  onChange={e => setSemesterStart(e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </label>
              <label className="flex flex-col items-center">
                <span className="font-medium mb-1">Semester End Date</span>
                <input
                  type="date"
                  value={semesterEnd}
                  onChange={e => setSemesterEnd(e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </label>
              <label className="flex flex-col items-center">
                <span className="font-medium mb-1">Time Zone</span>
                <select
                  value={timeZone}
                  onChange={e => setTimeZone(e.target.value)}
                  className="border rounded px-2 py-1 min-w-[220px]"
                >
                  {timeZones.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <ScheduleTable entries={groupedTableEntries} onEdit={handleEdit} />
            <div className="flex justify-center mt-4">
              <button
                onClick={downloadICS}
                className="px-6 py-2 rounded bg-purple-700 text-white font-semibold hover:bg-purple-800 shadow"
              >
                Download .ics
              </button>
            </div>
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
