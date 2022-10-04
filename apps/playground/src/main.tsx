import '@jonasb/datadata-admin-react-components/main.css';
import '@jonasb/datadata-design/main.css';
import '@jonasb/datadata-leaflet/icons.css';
import '@jonasb/datadata-leaflet/main.css';
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './main.css';

//TODO bundle CSS in ARC and remove need to add all css files here and to have direct dependencies to design/dd-leaflet/leaflet

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
