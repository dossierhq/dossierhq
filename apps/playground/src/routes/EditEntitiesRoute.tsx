import { EntityEditorScreen, EntityEditorSelector } from '@jonasb/datadata-admin-react-components';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

export function EditEntitiesRoute() {
  const [searchParams, setSearchParams] = useSearchParams();

  //TODO cleanup EntityEditorScreen urlQuery interface
  const entitySelectors = useMemo(() => {
    const result: EntityEditorSelector[] = [];
    const type = searchParams.get('type');
    if (type) {
      result.push({ newType: type });
    }
    for (const id of searchParams.get('ids')?.split(',') ?? []) {
      result.push({ id });
    }
    return result;
  }, [searchParams]);

  const handleEntityIdsChanged = useCallback(
    (ids: string[]) => {
      const idsString = ids.join(',');
      if (idsString !== searchParams.get('ids')) {
        setSearchParams({ ids: idsString });
      }
    },
    [setSearchParams, searchParams]
  );

  return (
    <EntityEditorScreen
      header={<NavBar current="admin-entities" />}
      entitySelectors={entitySelectors}
      onEntityIdsChanged={handleEntityIdsChanged}
    />
  );
}
