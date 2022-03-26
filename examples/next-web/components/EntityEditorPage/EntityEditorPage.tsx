import type { EntityEditorSelector } from '@jonasb/datadata-admin-react-components';
import { EntityEditorScreen } from '@jonasb/datadata-admin-react-components';
import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { urls } from '../../utils/PageUtils';
import { NavBar } from '../NavBar/NavBar';

export interface EntityEditorPageProps {
  entitySelectors: EntityEditorSelector[];
}

export function EntityEditorPage({ entitySelectors }: EntityEditorPageProps): JSX.Element {
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
      <EntityEditorScreen
        header={<NavBar current="entities" />}
        entitySelectors={entitySelectors}
        onEntityIdsChanged={handleEntityIdsChanged}
      ></EntityEditorScreen>
    </DataDataSharedProvider>
  );
}
