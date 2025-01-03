import { ContentListScreen, ThemeProvider } from '@dossierhq/react-components2';
import { useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { assertIsDefined } from '../utils/AssertUtils.js';
import { ROUTE } from '../utils/RouteUtils.js';

export function ContentListRoute() {
  const navigate = useNavigate();
  const { serverName } = useParams<{ serverName: string }>();
  assertIsDefined(serverName);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSearchParamsChange = useCallback(
    (searchParams: URLSearchParams) => setSearchParams(searchParams, { replace: true }),
    [setSearchParams],
  );

  const handleCreateEntity = useCallback(
    (type: string) => {
      void navigate(
        ROUTE.contentEditor.url(
          serverName,
          { entities: [{ isNew: true, type, id: crypto.randomUUID() }] },
          searchParams,
        ),
      );
    },
    [navigate, serverName, searchParams],
  );
  const handleEntityOpen = useCallback(
    (id: string) => {
      // TODO should ContentListScreen callbacks support promises?
      void navigate(ROUTE.contentEditor.url(serverName, { entities: [{ id }] }, searchParams));
    },
    [navigate, serverName, searchParams],
  );

  return (
    <ThemeProvider>
      <ContentListScreen
        // header={<NavBar current="content" />}
        urlSearchParams={searchParams}
        onUrlSearchParamsChange={handleSearchParamsChange}
        onCreateEntity={handleCreateEntity}
        onOpenEntity={handleEntityOpen}
      />
    </ThemeProvider>
  );
}
