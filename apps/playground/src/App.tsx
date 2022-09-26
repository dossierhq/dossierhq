import { NotificationContainer } from '@jonasb/datadata-design';
import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DatabaseProvider } from './components/DatabaseProvider';
import { DataDataSharedProvider } from './components/DataDataSharedProvider';
import { ServerProvider } from './components/ServerProvider';
import type { User } from './contexts/UserContext';
import { UserContext } from './contexts/UserContext';
import { AdminEntitiesRoute } from './routes/AdminEntitiesRoute';
import { CloudinaryTestRoute } from './routes/CloudinaryTestRoute';
import { EditEntitiesRoute } from './routes/EditEntitiesRoute';
import { EditSchemaRoute } from './routes/EditSchemaRoute';
import { GraphiQLRoute } from './routes/GraphiQLRoute';
import { IndexRoute } from './routes/IndexRoute';
import { LoginRoute } from './routes/LoginRoute';
import { PublishedEntitiesRoute } from './routes/PublishedEntitiesRoute';
import { PublishedEntityDisplayRoute } from './routes/PublishedEntityDisplayRoute';
import { ROUTE } from './utils/RouteUtils';

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
                  <Route path={ROUTE.cloudinaryTest.route} element={<CloudinaryTestRoute />} />
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
