import { NotificationContainer } from '@dossierhq/design';
import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { DatabaseProvider } from './components/DatabaseProvider.js';
import { DossierSharedProvider } from './components/DossierSharedProvider.js';
import { ServerProvider } from './components/ServerProvider.js';
import type { User } from './contexts/UserContext.js';
import { UserContext } from './contexts/UserContext.js';
import { AdminEntitiesRoute } from './routes/AdminEntitiesRoute.js';
import { EditEntitiesRoute } from './routes/EditEntitiesRoute.js';
import { EditSchemaRoute } from './routes/EditSchemaRoute.js';
import { GraphiQLRoute } from './routes/GraphiQLRoute.js';
import { IndexRoute } from './routes/IndexRoute.js';
import { LoginRoute } from './routes/LoginRoute.js';
import { PublishedEntitiesRoute } from './routes/PublishedEntitiesRoute.js';
import { PublishedEntityDisplayRoute } from './routes/PublishedEntityDisplayRoute.js';
import { ServerRoute } from './routes/ServerRoute.js';
import { ROUTE } from './utils/RouteUtils.js';

const users: User[] = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
];

const router = createBrowserRouter([
  { path: ROUTE.index.route, element: <IndexRoute /> },
  { path: ROUTE.server.route, element: <ServerRoute /> },
  { path: ROUTE.adminEntities.route, element: <AdminEntitiesRoute /> },
  { path: ROUTE.editEntities.route, element: <EditEntitiesRoute /> },
  { path: ROUTE.login.route, element: <LoginRoute /> },
  { path: ROUTE.publishedEntities.route, element: <PublishedEntitiesRoute /> },
  { path: ROUTE.publishedEntityDisplay.route, element: <PublishedEntityDisplayRoute /> },
  { path: ROUTE.schema.route, element: <EditSchemaRoute /> },
  { path: ROUTE.graphiql.route, element: <GraphiQLRoute /> },
]);

export default function App() {
  const [currentUserId, setCurrentUserId] = useState(users[0].id);
  return (
    <NotificationContainer>
      <UserContext.Provider value={{ currentUserId, users, setCurrentUserId }}>
        <DatabaseProvider>
          <ServerProvider>
            <DossierSharedProvider>
              <RouterProvider router={router} />
            </DossierSharedProvider>
          </ServerProvider>
        </DatabaseProvider>
      </UserContext.Provider>
    </NotificationContainer>
  );
}
