import '@dossierhq/react-components2/main.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './main.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
