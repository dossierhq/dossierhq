import { Auth0Provider } from '@auth0/auth0-react';
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
      <BrowserRouter>
        <Auth0Provider
          domain={import.meta.env.VITE_AUTH0_DOMAIN}
          clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
          audience={import.meta.env.VITE_AUTH0_AUDIENCE}
          redirectUri={window.location.origin}
        >
          <AppAdminProvider>
            <AppPublishedProvider>
              <Routes>
                <Route path="/" element={<IndexRoute />} />
                <Route path="/admin-entities" element={<AdminEntityListRoute />} />
                <Route path="/edit-entities" element={<AdminEntityEditorRoute />} />
                <Route path="/published-entities" element={<PublishedEntityListRoute />} />
                <Route
                  path="/published-entities/display"
                  element={<PublishedEntityDisplayRoute />}
                />
                <Route path="/schema" element={<AdminSchemaEditorRoute />} />
              </Routes>
            </AppPublishedProvider>
          </AppAdminProvider>
        </Auth0Provider>
      </BrowserRouter>
    </NotificationContainer>
  );
}
