import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ContentEditorRoute } from './routes/ContentEditorRoute.js';
import { ContentListRoute } from './routes/ContentListRoute.js';
import { IndexRoute } from './routes/IndexRoute.js';
import { LoginRoute } from './routes/LoginRoute.js';
import { RootLayout } from './routes/RootLayout.js';
import { ServerLayout } from './routes/ServerLayout.js';
import { ServerRoute } from './routes/ServerRoute.js';
import { ROUTE } from './utils/RouteUtils.js';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <IndexRoute /> },
      {
        path: ':serverName',
        element: <ServerLayout />,
        children: [
          { index: true, element: <ServerRoute /> },
          { path: ROUTE.contentList.route, element: <ContentListRoute /> },
          { path: ROUTE.contentEditor.route, element: <ContentEditorRoute /> },
          { path: ROUTE.login.route, element: <LoginRoute /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
