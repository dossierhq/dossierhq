import { ChangelogScreen } from '@dossierhq/react-components';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from './Navbar.js';

export function AdminChangelogRoute() {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <ChangelogScreen
      header={<Navbar current="changelog" />}
      urlSearchParams={searchParams}
      onUrlSearchParamsChange={setSearchParams}
    />
  );
}
