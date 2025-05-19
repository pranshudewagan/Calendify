import React from 'react';
import ScheduleUpload from './components/ScheduleUpload';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4 text-center text-2xl font-bold">
        Calendify
      </header>
      <main className="p-6">
        <ScheduleUpload />
      </main>
    </div>
  );
}

export default App;