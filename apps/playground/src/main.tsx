import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@jonasb/datadata-admin-react-components/main.css';
import '@jonasb/datadata-admin-react-components/icons.css';
import '@jonasb/datadata-design/main.css';
import 'leaflet/dist/leaflet.css';

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
