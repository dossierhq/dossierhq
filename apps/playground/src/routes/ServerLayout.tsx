import { Outlet } from 'react-router-dom';
import { DossierSharedProvider } from '../components/DossierSharedProvider.js';
import { ServerProvider } from '../components/ServerProvider.js';

export function ServerLayout() {
  return (
    <ServerProvider>
      <DossierSharedProvider>
        <Outlet />
      </DossierSharedProvider>
    </ServerProvider>
  );
}
