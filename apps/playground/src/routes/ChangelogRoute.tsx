import { assertIsDefined } from '@dossierhq/core';
import { ChangelogScreen } from '@dossierhq/react-components';
import { useParams, useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar.js';

export function ChangelogRoute() {
  const { serverName } = useParams<{ serverName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  assertIsDefined(serverName);

  return (
    <ChangelogScreen
      header={<NavBar current="changelog" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={setSearchParams}
    />
  );
}
