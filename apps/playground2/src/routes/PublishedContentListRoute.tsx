import { PublishedContentListScreen, ThemeProvider } from '@dossierhq/react-components2';
import { useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar.js';
import { assertIsDefined } from '../utils/AssertUtils.js';
import { ROUTE } from '../utils/RouteUtils.js';

export function PublishedContentListRoute() {
  const navigate = useNavigate();
  const { serverName } = useParams<{ serverName: string }>();
  assertIsDefined(serverName);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSearchParamsChange = useCallback(
    (searchParams: URLSearchParams) => setSearchParams(searchParams, { replace: true }),
    [setSearchParams],
  );

  const handleEntityOpen = useCallback(
    (id: string) => {
      void navigate(ROUTE.publishedContentDisplay.url(serverName, [id]));
    },
    [navigate, serverName],
  );

  return (
    <ThemeProvider>
      <PublishedContentListScreen
        header={<NavBar current="published-content" />}
        urlSearchParams={searchParams}
        onUrlSearchParamsChange={handleSearchParamsChange}
        onOpenEntity={handleEntityOpen}
      />
    </ThemeProvider>
  );
}
