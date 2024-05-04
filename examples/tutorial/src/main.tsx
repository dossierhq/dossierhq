import '@dossierhq/design/main.css';
import '@dossierhq/leaflet/icons.css';
import '@dossierhq/leaflet/main.css';
import '@dossierhq/react-components/main.css';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
