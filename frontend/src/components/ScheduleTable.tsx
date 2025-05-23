import React from 'react';
import { ProcessedEntry } from '../types';

interface Props {
  entries: ProcessedEntry[];
  onEdit: (index: number, updated: ProcessedEntry) => void;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const ScheduleTable: React.FC<Props> = ({ entries, onEdit }) => {
  const handleDayToggle = (index: number, day: string) => {
    const entry = entries[index];
    const newDays = entry.days.includes(day)
      ? entry.days.filter(d => d !== day)
      : [...entry.days, day];
    
    onEdit(index, { ...entry, days: newDays });
  };

  const validateTime = (time: string): boolean => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b">
        Edit Schedule
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Course</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Days</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 min-w-[250px]">Time</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map((entry, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <input
                    value={entry.course}
                    onChange={e =>
                      onEdit(idx, { ...entry, course: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Course name"
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day}
                        onClick={() => handleDayToggle(idx, day)}
                        className={`px-2 py-1 text-sm rounded ${
                          entry.days.includes(day)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2 min-w-[250px]">
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={entry.startTime}
                      onChange={e =>
                        onEdit(idx, { ...entry, startTime: e.target.value })
                      }
                      className={`w-36 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        entry.startTime && !validateTime(entry.startTime)
                          ? 'border-red-500'
                          : ''
                      }`}
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={entry.endTime}
                      onChange={e =>
                        onEdit(idx, { ...entry, endTime: e.target.value })
                      }
                      className={`w-36 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        entry.endTime && !validateTime(entry.endTime)
                          ? 'border-red-500'
                          : ''
                      }`}
                    />
                  </div>
                </td>
                <td className="px-4 py-2">
                  <input
                    value={entry.location}
                    onChange={e =>
                      onEdit(idx, { ...entry, location: e.target.value })
                    }
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Room number/location"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleTable;
