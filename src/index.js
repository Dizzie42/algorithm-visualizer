import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress ResizeObserver loop warning (harmless CRA dev noise)
const observer = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends observer {
  constructor(callback) {
    super((entries, ob) => {
      window.requestAnimationFrame(() => {
        callback(entries, ob);
      });
    });
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);