import type { EntityEditorSelector } from '@jonasb/datadata-admin-react-components';
import {
  AddEntityDraftAction,
  DataDataContext,
  EntityEditorContainer,
  EntityEditorDispatchContext,
  EntityEditorStateContext,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from '@jonasb/datadata-admin-react-components';
import { useRouter } from 'next/router';
import { useContext, useEffect, useReducer } from 'react';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { urls } from '../../utils/PageUtils';

export interface EntityEditorPageProps {
  entitySelectors: EntityEditorSelector[];
}

export function EntityEditorPage({ entitySelectors }: EntityEditorPageProps): JSX.Element {
  return (
    <DataDataSharedProvider>
      <EntityEditorPageInner entitySelectors={entitySelectors} />
    </DataDataSharedProvider>
  );
}

function EntityEditorPageInner({ entitySelectors }: { entitySelectors: EntityEditorSelector[] }) {
  const { schema } = useContext(DataDataContext);
  const router = useRouter();
  const [editorState, dispatchEditorState] = useReducer(
    reduceEntityEditorState,
    { schema, actions: entitySelectors.map((x) => new AddEntityDraftAction(x)) },
    initializeEntityEditorState
  );

  const ids = editorState.drafts.map((x) => x.id);
  useEffect(() => {
    const url = urls.editPage(ids);
    if (url !== router.asPath) {
      router.replace(url);
    }
  }, [ids, router]);

  return (
    <EntityEditorDispatchContext.Provider value={dispatchEditorState}>
      <EntityEditorStateContext.Provider value={editorState}>
        <EntityEditorContainer
          className="dd-position-fixed dd-inset-0"
          {...{ editorState, dispatchEditorState }}
        />
      </EntityEditorStateContext.Provider>
    </EntityEditorDispatchContext.Provider>
  );
}
