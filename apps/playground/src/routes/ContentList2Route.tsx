import { ContentListScreen } from '@dossierhq/react-components2';
import { useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { assertIsDefined } from '../utils/AssertUtils.js';
import { ROUTE } from '../utils/RouteUtils.js';

export function ContentList2Route() {
  const navigate = useNavigate();
  const { serverName } = useParams<{ serverName: string }>();
  // const [searchParams, setSearchParams] = useSearchParams();

  assertIsDefined(serverName);

  // const handleCreateEntity = useCallback(
  //   (type: string) =>
  //     navigate(ROUTE.contentEditor2.url(serverName, [{ newType: type, id: crypto.randomUUID() }])),
  //   [navigate, serverName],
  // );
  const handleEntityOpen = useCallback(
    (id: string) => navigate(ROUTE.contentEditor2.url(serverName, [{ id }])),
    [navigate, serverName],
  );

  return (
    <ContentListScreen
      // header={<NavBar current="content" />}
      // urlSearchParams={searchParams}
      // onUrlSearchParamsChange={setSearchParams}
      // onCreateEntity={handleCreateEntity}
      onOpenEntity={handleEntityOpen}
    />
  );
}