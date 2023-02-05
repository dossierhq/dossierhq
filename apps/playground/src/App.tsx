import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AdminEntitiesRoute } from './routes/AdminEntitiesRoute.js';
import { EditEntitiesRoute } from './routes/EditEntitiesRoute.js';
import { EditSchemaRoute } from './routes/EditSchemaRoute.js';
import { GraphiQLRoute } from './routes/GraphiQLRoute.js';
import { IndexRoute } from './routes/IndexRoute.js';
import { LoginRoute } from './routes/LoginRoute.js';
import { PublishedEntitiesRoute } from './routes/PublishedEntitiesRoute.js';
import { PublishedEntityDisplayRoute } from './routes/PublishedEntityDisplayRoute.js';
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
          { path: ROUTE.adminEntities.route, element: <AdminEntitiesRoute /> },
          { path: ROUTE.editEntities.route, element: <EditEntitiesRoute /> },
          { path: ROUTE.login.route, element: <LoginRoute /> },
          { path: ROUTE.publishedEntities.route, element: <PublishedEntitiesRoute /> },
          { path: ROUTE.publishedEntityDisplay.route, element: <PublishedEntityDisplayRoute /> },
          { path: ROUTE.schema.route, element: <EditSchemaRoute /> },
          { path: ROUTE.graphiql.route, element: <GraphiQLRoute /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
