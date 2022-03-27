import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ServerProvider } from './components/ServerProvider';
import { DataDataSharedProvider } from './components/DataDataSharedProvider';
import { AdminEntitiesRoute } from './routes/AdminEntitiesRoute';
import { ROUTE } from './utils/RouteUtils';
import { IndexRoute } from './routes/IndexRoute';
import { EditEntitiesRoute } from './routes/EditEntitiesRoute';
import { PublishedEntitiesRoute } from './routes/PublishedEntitiesRoute';
import { PublishedEntityDetailsRoute } from './routes/PublishedEntityDetailsRoute';

export default function App() {
  return (
    <ServerProvider>
      <DataDataSharedProvider>
        <BrowserRouter>
          <Routes>
            <Route path={ROUTE.index.route} element={<IndexRoute />} />
            <Route path={ROUTE.adminEntities.route} element={<AdminEntitiesRoute />} />
            <Route path={ROUTE.editEntities.route} element={<EditEntitiesRoute />} />
            <Route path={ROUTE.publishedEntities.route} element={<PublishedEntitiesRoute />} />
            <Route
              path={ROUTE.publishedEntityDetails.route}
              element={<PublishedEntityDetailsRoute />}
            />
          </Routes>
        </BrowserRouter>
      </DataDataSharedProvider>
    </ServerProvider>
  );
}
