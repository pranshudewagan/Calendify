import React from 'react';
import OCRUpload from './components/OCRUpload';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4 text-center text-2xl font-bold">
        Calendify
      </header>
      <main className="p-6">
        <OCRUpload />
      </main>
    </div>
  );
}

export default App;
