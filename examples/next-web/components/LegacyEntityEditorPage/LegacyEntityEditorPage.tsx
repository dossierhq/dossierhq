import type { LegacyEntityEditorSelector } from '@jonasb/datadata-admin-react-components';
import { LegacyEntityEditorScreen } from '@jonasb/datadata-admin-react-components';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { urls } from '../../utils/PageUtils';
import { NavBar } from '../NavBar/NavBar';

export interface LegacyEntityEditorPageProps {
  entitySelectors: LegacyEntityEditorSelector[];
}

export function LegacyEntityEditorPage({
  entitySelectors,
}: LegacyEntityEditorPageProps): JSX.Element {
  const router = useRouter();
  const handleEntityIdsChanged = useCallback(
    (ids: string[]) => {
      const url = urls.editPage(ids);
      if (url !== router.asPath) {
        router.replace(url);
      }
    },
    [router]
  );

  return (
    <DataDataSharedProvider>
      <LegacyEntityEditorScreen
        header={<NavBar current="entities" />}
        entitySelectors={entitySelectors}
        onEntityIdsChanged={handleEntityIdsChanged}
      />
    </DataDataSharedProvider>
  );
}
