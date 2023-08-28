import { Auth0Provider } from '@auth0/auth0-react';
import { NotificationContainer } from '@dossierhq/design';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AdminChangelogRoute } from './AdminChangelogRoute.js';
import { AdminEntityEditorRoute } from './AdminEntityEditorRoute.js';
import { AdminEntityListRoute } from './AdminEntityListRoute.js';
import { AdminSchemaEditorRoute } from './AdminSchemaEditorRoute.js';
import { AppAdminProvider } from './AppAdminProvider.js';
import { AppPublishedProvider } from './AppPublishedProvider.js';
import { IndexRoute } from './IndexRoute.js';
import { PublishedEntityDisplayRoute } from './PublishedEntityDisplayRoute.js';
import { PublishedEntityListRoute } from './PublishedEntityListRoute.js';

const router = createBrowserRouter([
  { path: '/', element: <IndexRoute /> },
  { path: '/admin-entities', element: <AdminEntityListRoute /> },
  { path: '/edit-entities', element: <AdminEntityEditorRoute /> },
  { path: '/published-entities', element: <PublishedEntityListRoute /> },
  { path: '/published-entities/display', element: <PublishedEntityDisplayRoute /> },
  { path: '/schema', element: <AdminSchemaEditorRoute /> },
  { path: '/changelog', element: <AdminChangelogRoute /> },
]);

export default function App() {
  return (
    <NotificationContainer>
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          redirect_uri: window.location.origin,
        }}
      >
        <AppAdminProvider>
          <AppPublishedProvider>
            <RouterProvider router={router} />
          </AppPublishedProvider>
        </AppAdminProvider>
      </Auth0Provider>
    </NotificationContainer>
  );
}
