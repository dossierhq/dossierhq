import { NotificationContainer } from '@jonasb/datadata-design';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminEntitiesRoute } from './AdminEntitiesRoute.js';
import { DataDataSharedProvider } from './DataDataSharedProvider.js';
import { EditEntitiesRoute } from './EditEntitiesRoute.js';
import { EditSchemaRoute } from './EditSchemaRoute.js';
import { IndexRoute } from './IndexRoute.js';
import { PublishedEntitiesRoute } from './PublishedEntitiesRoute.js';
import { PublishedEntityDisplayRoute } from './PublishedEntityDisplayRoute.js';

export default function App() {
  return (
    <NotificationContainer>
      <DataDataSharedProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<IndexRoute />} />
            <Route path="/admin-entities" element={<AdminEntitiesRoute />} />
            <Route path="/edit-entities" element={<EditEntitiesRoute />} />
            <Route path="/published-entities" element={<PublishedEntitiesRoute />} />
            <Route path="/published-entities/display" element={<PublishedEntityDisplayRoute />} />
            <Route path="/schema" element={<EditSchemaRoute />} />
          </Routes>
        </BrowserRouter>
      </DataDataSharedProvider>
    </NotificationContainer>
  );
}
