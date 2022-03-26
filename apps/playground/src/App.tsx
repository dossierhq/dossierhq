import { ServerProvider } from './components/ServerProvider';
import { DataDataSharedProvider } from './components/DataDataSharedProvider';
import { AdminListScreen } from './screen/AdminListScreen';

export default function App() {
  return (
    <ServerProvider>
      <DataDataSharedProvider>
        <AdminListScreen />
      </DataDataSharedProvider>
    </ServerProvider>
  );
}
