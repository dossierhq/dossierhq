import { ServerProvider } from './components/ServerProvider';
import { DataDataSharedProvider } from './components/DataDataSharedProvider';
import { AdminEntitiesRoute } from './routes/AdminEntitiesRoute';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ROUTE } from './utils/RouteUtils';
import { IndexRoute } from './routes/IndexRoute';
import { EditEntitiesRoute } from './routes/EditEntitiesRoute';

export default function App() {
  return (
    <ServerProvider>
      <DataDataSharedProvider>
        <BrowserRouter>
          <Routes>
            <Route path={ROUTE.index.route} element={<IndexRoute />} />
            <Route path={ROUTE.adminEntities.route} element={<AdminEntitiesRoute />} />
            <Route path={ROUTE.editEntities.route} element={<EditEntitiesRoute />} />
          </Routes>
        </BrowserRouter>
      </DataDataSharedProvider>
    </ServerProvider>
  );
}
