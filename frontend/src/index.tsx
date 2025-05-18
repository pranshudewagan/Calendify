import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Tailwind CSS and other global styles
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
