import { ChangelogListScreen } from '@dossierhq/react-components';
import { useParams, useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar.jsx';
import { assertIsDefined } from '../utils/AssertUtils.js';

export function ChangelogListRoute() {
  const { serverName } = useParams<{ serverName: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  assertIsDefined(serverName);

  return (
    <ChangelogListScreen
      header={<NavBar current="changelog" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={setSearchParams}
    />
  );
}
