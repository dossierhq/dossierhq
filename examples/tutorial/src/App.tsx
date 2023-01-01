import { NotificationContainer } from '@jonasb/datadata-design';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminEntityEditorRoute } from './AdminEntityEditorRoute.js';
import { AdminEntityListRoute } from './AdminEntityListRoute.js';
import { AdminSchemaEditorRoute } from './AdminSchemaEditorRoute.js';
import { AppAdminProvider } from './AppAdminProvider.js';
import { AppPublishedProvider } from './AppPublishedProvider.js';
import { IndexRoute } from './IndexRoute.js';
import { PublishedEntityDisplayRoute } from './PublishedEntityDisplayRoute.js';
import { PublishedEntityListRoute } from './PublishedEntityListRoute.js';

export default function App() {
  return (
    <NotificationContainer>
      <AppAdminProvider>
        <AppPublishedProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<IndexRoute />} />
              <Route path="/admin-entities" element={<AdminEntityListRoute />} />
              <Route path="/edit-entities" element={<AdminEntityEditorRoute />} />
              <Route path="/published-entities" element={<PublishedEntityListRoute />} />
              <Route path="/published-entities/display" element={<PublishedEntityDisplayRoute />} />
              <Route path="/schema" element={<AdminSchemaEditorRoute />} />
            </Routes>
          </BrowserRouter>
        </AppPublishedProvider>
      </AppAdminProvider>
    </NotificationContainer>
  );
}
