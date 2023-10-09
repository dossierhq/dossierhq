import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ContentRoute } from './routes/ContentRoute.js';
import { ChangelogRoute } from './routes/ChangelogRoute.js';
import { EditEntitiesRoute } from './routes/EditContentRoute.js';
import { EditSchemaRoute } from './routes/EditSchemaRoute.js';
import { GraphiQLRoute } from './routes/GraphiQLRoute.js';
import { IndexRoute } from './routes/IndexRoute.js';
import { LoginRoute } from './routes/LoginRoute.js';
import { PublishedContentRoute } from './routes/PublishedContentRoute.js';
import { PublishedContentDisplayRoute } from './routes/PublishedContentDisplayRoute.js';
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
          { path: ROUTE.content.route, element: <ContentRoute /> },
          { path: ROUTE.editEntities.route, element: <EditEntitiesRoute /> },
          { path: ROUTE.login.route, element: <LoginRoute /> },
          { path: ROUTE.publishedContent.route, element: <PublishedContentRoute /> },
          { path: ROUTE.publishedContentDisplay.route, element: <PublishedContentDisplayRoute /> },
          { path: ROUTE.schema.route, element: <EditSchemaRoute /> },
          { path: ROUTE.changelog.route, element: <ChangelogRoute /> },
          { path: ROUTE.graphiql.route, element: <GraphiQLRoute /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
