import { Auth0Provider } from '@auth0/auth0-react';
import { ThemeProvider } from '@dossierhq/react-components2';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppAdminProvider } from './AppAdminProvider.js';
import { AppPublishedProvider } from './AppPublishedProvider.js';
import { ChangelogListRoute } from './ChangelogListRoute.js';
import { ContentEditorRoute } from './ContentEditorRoute.js';
import { ContentListRoute } from './ContentListRoute.js';
import { IndexRoute } from './IndexRoute.js';
import { PublishedContentDisplayRoute } from './PublishedContentDisplayRoute.js';
import { PublishedContentListRoute } from './PublishedContentListRoute.js';
import { SchemaEditorRoute } from './SchemaEditorRoute.js';

const router = createBrowserRouter([
  { path: '/', element: <IndexRoute /> },
  { path: '/content', element: <ContentListRoute /> },
  { path: '/edit-content', element: <ContentEditorRoute /> },
  { path: '/published-content', element: <PublishedContentListRoute /> },
  { path: '/published-content/display', element: <PublishedContentDisplayRoute /> },
  { path: '/schema', element: <SchemaEditorRoute /> },
  { path: '/changelog', element: <ChangelogListRoute /> },
]);

export default function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}
