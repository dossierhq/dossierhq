import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import '@jonasb/datadata-admin-react-components/main.css';
import '@jonasb/datadata-admin-react-components/icons.css';
import '@jonasb/datadata-design/main.css';
import 'leaflet/dist/leaflet.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
