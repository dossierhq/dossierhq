import { NotificationContainer } from '@jonasb/datadata-design';
import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DatabaseProvider } from './components/DatabaseProvider.js';
import { DataDataSharedProvider } from './components/DataDataSharedProvider.js';
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
import { ROUTE } from './utils/RouteUtils.js';

const users: User[] = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
];

export default function App() {
  const [currentUserId, setCurrentUserId] = useState(users[0].id);
  return (
    <NotificationContainer>
      <UserContext.Provider value={{ currentUserId, users, setCurrentUserId }}>
        <DatabaseProvider>
          <ServerProvider>
            <DataDataSharedProvider>
              <BrowserRouter>
                <Routes>
                  <Route path={ROUTE.index.route} element={<IndexRoute />} />
                  <Route path={ROUTE.adminEntities.route} element={<AdminEntitiesRoute />} />
                  <Route path={ROUTE.editEntities.route} element={<EditEntitiesRoute />} />
                  <Route path={ROUTE.login.route} element={<LoginRoute />} />
                  <Route
                    path={ROUTE.publishedEntities.route}
                    element={<PublishedEntitiesRoute />}
                  />
                  <Route
                    path={ROUTE.publishedEntityDisplay.route}
                    element={<PublishedEntityDisplayRoute />}
                  />
                  <Route path={ROUTE.schema.route} element={<EditSchemaRoute />} />
                  <Route path={ROUTE.graphiql.route} element={<GraphiQLRoute />} />
                </Routes>
              </BrowserRouter>
            </DataDataSharedProvider>
          </ServerProvider>
        </DatabaseProvider>
      </UserContext.Provider>
    </NotificationContainer>
  );
}
