import { ContentListScreen } from '@dossierhq/react-components2';
import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar.js';

export function ContentListRoute() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleCreateEntity = useCallback(
    (type: string) => navigate(`/edit-content?new=${type}:${crypto.randomUUID()}`),
    [navigate],
  );
  const handleEntityOpen = useCallback(
    (id: string) => navigate(`/edit-content?id=${id}`),
    [navigate],
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
