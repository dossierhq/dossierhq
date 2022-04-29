import type { EntityEditorStateUrlQuery } from '@jonasb/datadata-admin-react-components';
import { AdminEntityEditorScreen } from '@jonasb/datadata-admin-react-components';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { NavBar } from '../NavBar/NavBar';

export default function AdminEntityEditorPage(): JSX.Element {
  const router = useRouter();
  const handleUrlQueryChanged = useCallback(
    (urlQuery: EntityEditorStateUrlQuery) => {
      //@ts-ignore
      router.replace({ pathname: router.pathname, query: urlQuery });
    },
    [router]
  );

  return (
    <DataDataSharedProvider>
      <AdminEntityEditorScreen
        header={<NavBar current="entities" />}
        urlQuery={router.query}
        onUrlQueryChange={handleUrlQueryChanged}
      />
    </DataDataSharedProvider>
  );
}
