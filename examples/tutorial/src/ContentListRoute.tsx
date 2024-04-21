import type { Entity } from '@dossierhq/core';
import { ContentListScreen } from '@dossierhq/react-components';
import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar.js';

export function ContentListRoute() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleCreateEntity = useCallback(
    (type: string) => navigate(`/edit-content?new=${type}:${crypto.randomUUID()}`),
    [navigate]
  );
  const handleEntityOpen = useCallback(
    (entity: Entity) => navigate(`/edit-content?id=${entity.id}`),
    [navigate]
  );

  return (
    <ContentListScreen
      header={<Navbar current="content" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={setSearchParams}
      onCreateEntity={handleCreateEntity}
      onOpenEntity={handleEntityOpen}
    />
  );
}
