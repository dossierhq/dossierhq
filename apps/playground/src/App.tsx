import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ChangelogListRoute } from './routes/ChangelogListRoute.js';
import { ContentEditorRoute } from './routes/ContentEditorRoute.js';
import { ContentListRoute } from './routes/ContentListRoute.js';
import { GraphiQLRoute } from './routes/GraphiQLRoute.js';
import { IndexRoute } from './routes/IndexRoute.js';
import { LoginRoute } from './routes/LoginRoute.js';
import { PublishedContentDisplayRoute } from './routes/PublishedContentDisplayRoute.js';
import { PublishedContentListRoute } from './routes/PublishedContentListRoute.js';
import { RootLayout } from './routes/RootLayout.js';
import { SchemaEditorRoute } from './routes/SchemaEditorRoute.js';
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
          { path: ROUTE.publishedContentList.route, element: <PublishedContentListRoute /> },
          { path: ROUTE.publishedContentDisplay.route, element: <PublishedContentDisplayRoute /> },
          { path: ROUTE.schemaEditor.route, element: <SchemaEditorRoute /> },
          { path: ROUTE.changelogList.route, element: <ChangelogListRoute /> },
          { path: ROUTE.graphiql.route, element: <GraphiQLRoute /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
