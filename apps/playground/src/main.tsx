import '@dossierhq/react-components/main.css';
import '@dossierhq/design/main.css';
import '@dossierhq/leaflet/icons.css';
import '@dossierhq/leaflet/main.css';
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
  </React.StrictMode>,
);
