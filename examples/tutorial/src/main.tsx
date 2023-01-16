import '@dossierhq/react-components/main.css';
import '@dossierhq/design/main.css';
import '@jonasb/datadata-leaflet/icons.css';
import '@jonasb/datadata-leaflet/main.css';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
