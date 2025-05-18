import React from 'react';

export interface ScheduleEntry {
  course: string;
  days: string[];
  startTime: string;
  endTime: string;
  location: string;
}

interface Props {
  entries: ScheduleEntry[];
  onEdit: (index: number, updated: ScheduleEntry) => void;
}

const ScheduleTable: React.FC<Props> = ({ entries, onEdit }) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-2">Parsed Schedule</h3>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Course</th>
            <th className="border p-2">Days</th>
            <th className="border p-2">Start</th>
            <th className="border p-2">End</th>
            <th className="border p-2">Location</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx} className="bg-white">
              <td className="border p-2">
                <input
                  value={entry.course}
                  onChange={e =>
                    onEdit(idx, { ...entry, course: e.target.value })
                  }
                  className="w-full"
                />
              </td>
              <td className="border p-2">
                <input
                  value={entry.days.join(', ')}
                  onChange={e =>
                    onEdit(idx, {
                      ...entry,
                      days: e.target.value.split(',').map(d => d.trim()),
                    })
                  }
                  className="w-full"
                />
              </td>
              <td className="border p-2">
                <input
                  value={entry.startTime}
                  onChange={e =>
                    onEdit(idx, { ...entry, startTime: e.target.value })
                  }
                  className="w-full"
                />
              </td>
              <td className="border p-2">
                <input
                  value={entry.endTime}
                  onChange={e =>
                    onEdit(idx, { ...entry, endTime: e.target.value })
                  }
                  className="w-full"
                />
              </td>
              <td className="border p-2">
                <input
                  value={entry.location}
                  onChange={e =>
                    onEdit(idx, { ...entry, location: e.target.value })
                  }
                  className="w-full"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleTable;
