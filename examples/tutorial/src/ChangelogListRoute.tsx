import { ChangelogListScreen } from '@dossierhq/react-components';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar.js';

export function ChangelogListRoute() {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <ChangelogListScreen
      header={<Navbar current="changelog" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={setSearchParams}
    />
  );
}
