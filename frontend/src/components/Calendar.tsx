import React from 'react';
import { ProcessedEntry } from '../types';

interface Props {
  entries: ProcessedEntry[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const START_HOUR = 8; // 8 AM
const END_HOUR = 17; // 5 PM
const HOUR_HEIGHT = 60;

const Calendar: React.FC<Props> = ({ entries }) => {
  const getTimePosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return ((hours - START_HOUR) + minutes / 60) * HOUR_HEIGHT;
  };

  const getEventHeight = (startTime: string, endTime: string): number => {
    const start = getTimePosition(startTime);
    const end = getTimePosition(endTime);
    return end - start;
  };

  // Generalizable color palette
  const colorPalette = [
    'bg-blue-600 text-white',
    'bg-green-700 text-white',
    'bg-red-800 text-white',
    'bg-amber-600 text-white',
    'bg-purple-600 text-white',
    'bg-pink-600 text-white',
    'bg-cyan-700 text-white',
    'bg-indigo-700 text-white',
    'bg-teal-700 text-white',
    'bg-yellow-600 text-white',
    'bg-gray-700 text-white',
    'bg-lime-700 text-white',
    'bg-orange-700 text-white',
    'bg-fuchsia-700 text-white',
    'bg-rose-700 text-white',
  ];

  // Hash function for consistent color assignment
  const getEventColor = (course: string, section: string): string => {
    const str = `${course} ${section}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colorPalette.length;
    return colorPalette[idx];
  };

  const timeSlots = Array.from(
    { length: (END_HOUR - START_HOUR) * 2 }, // Every 30 minutes
    (_, i) => {
      const hour = Math.floor(i / 2) + START_HOUR;
      const minutes = (i % 2) * 30;
      return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  );

  // Helper to format 24h time to 12h am/pm
  const format12Hour = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Helper to check if two events overlap
  const eventsOverlap = (a: {start: number, end: number}, b: {start: number, end: number}) => {
    return a.start < b.end && b.start < a.end;
  };

  // For a list of events, assign columns for overlapping events
  function assignColumns(dayEntries: ProcessedEntry[]) {
    // Map entries to time positions
    const events = dayEntries.map((entry, idx) => ({
      ...entry,
      _idx: idx,
      _start: getTimePosition(entry.startTime),
      _end: getTimePosition(entry.endTime),
    }));
    // Sort by start time
    events.sort((a, b) => a._start - b._start);
    // Assign columns
    const columns: number[] = Array(events.length).fill(0);
    const maxColumns: number[] = Array(events.length).fill(1);
    for (let i = 0; i < events.length; i++) {
      let col = 0;
      // Find all previous events that overlap
      for (let j = 0; j < i; j++) {
        if (eventsOverlap({start: events[i]._start, end: events[i]._end}, {start: events[j]._start, end: events[j]._end}) && columns[j] === col) {
          col++;
          j = -1; // restart check for new col
        }
      }
      columns[i] = col;
      // Update maxColumns for all overlapping events
      for (let j = 0; j <= i; j++) {
        if (eventsOverlap({start: events[i]._start, end: events[i]._end}, {start: events[j]._start, end: events[j]._end})) {
          maxColumns[j] = Math.max(maxColumns[j], col + 1);
          maxColumns[i] = Math.max(maxColumns[i], columns[j] + 1);
        }
      }
    }
    // Return events with column and total columns info
    return events.map((e, i) => ({ ...e, _column: columns[i], _totalColumns: maxColumns[i] }));
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="grid grid-cols-[100px_repeat(5,1fr)] border-b">
        <div className="p-4 font-semibold text-gray-500"></div>
        {DAYS.map(day => (
          <div key={day} className="p-4 font-semibold text-center border-l">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-[100px_repeat(5,1fr)] relative">
        <div className="divide-y">
          {timeSlots.map(time => (
            <div
              key={time}
              className="h-[30px] p-2 text-xs text-gray-500 w-[200px]"
            >
              {format12Hour(time)}
            </div>
          ))}
        </div>
        
        {DAYS.map(day => {
          const dayEntries = entries.filter(entry => entry.days.includes(day) && entry.startTime && entry.endTime);
          const eventsWithColumns = assignColumns(dayEntries);
          return (
            <div key={day} className="border-l relative">
              <div className="absolute inset-0 divide-y">
                {timeSlots.map(time => (
                  <div key={time} className="h-[30px]" />
                ))}
              </div>
              {eventsWithColumns.map((entry, idx) => (
                <div
                  key={`${day}-${idx}`}
                  className={`absolute p-1 rounded shadow-sm overflow-hidden ${getEventColor(entry.course, entry.section)}`}
                  style={{
                    left: `calc(${(entry._column / entry._totalColumns) * 100}% + 2px)` ,
                    width: `calc(${100 / entry._totalColumns}% - 4px)` ,
                    top: getTimePosition(entry.startTime),
                    height: getEventHeight(entry.startTime, entry.endTime),
                  }}
                >
                  <div className="text-xs font-semibold">{entry.course}</div>
                  <div className="text-xs">
                    {entry.startTime} - {entry.endTime}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar; 