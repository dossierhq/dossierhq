import { AdminEntityListScreen } from '@jonasb/datadata-admin-react-components';
import type { AdminEntity } from '@jonasb/datadata-core';
import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar.js';

export function AdminEntityListRoute() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleCreateEntity = useCallback(
    (type: string) => navigate(`/edit-entities?newType=${type}&id=${crypto.randomUUID()}`),
    [navigate]
  );
  const handleEntityOpen = useCallback(
    (entity: AdminEntity) => navigate(`/edit-entities?id=${entity.id}`),
    [navigate]
  );

  return (
    <AdminEntityListScreen
      header={<Navbar current="admin-entities" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={setSearchParams}
      onCreateEntity={handleCreateEntity}
      onOpenEntity={handleEntityOpen}
    />
  );
}
