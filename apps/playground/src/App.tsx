import { BeforeUnload, NotificationContainer } from '@jonasb/datadata-design';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DataDataSharedProvider } from './components/DataDataSharedProvider';
import { ServerProvider } from './components/ServerProvider';
import { EditEntitiesRoute } from './routes/EditEntitiesRoute';
import { AdminEntitiesRoute } from './routes/AdminEntitiesRoute';
import { LegacyEditEntitiesRoute } from './routes/LegacyEditEntitiesRoute';
import { EditSchemaRoute } from './routes/EditSchemaRoute';
import { IndexRoute } from './routes/IndexRoute';
import { PublishedEntitiesRoute } from './routes/PublishedEntitiesRoute';
import { PublishedEntityDetailsRoute } from './routes/PublishedEntityDetailsRoute';
import { ROUTE } from './utils/RouteUtils';

export default function App() {
  return (
    <NotificationContainer>
      <ServerProvider>
        <BeforeUnload message="Leaving the page will delete the database" />
        <DataDataSharedProvider>
          <BrowserRouter>
            <Routes>
              <Route path={ROUTE.index.route} element={<IndexRoute />} />
              <Route path={ROUTE.adminEntities.route} element={<AdminEntitiesRoute />} />
              <Route path={ROUTE.editEntities.route} element={<EditEntitiesRoute />} />
              <Route path={ROUTE.legacyEditEntities.route} element={<LegacyEditEntitiesRoute />} />
              <Route path={ROUTE.publishedEntities.route} element={<PublishedEntitiesRoute />} />
              <Route
                path={ROUTE.publishedEntityDetails.route}
                element={<PublishedEntityDetailsRoute />}
              />
              <Route path={ROUTE.schema.route} element={<EditSchemaRoute />} />
            </Routes>
          </BrowserRouter>
        </DataDataSharedProvider>
      </ServerProvider>
    </NotificationContainer>
  );
}
