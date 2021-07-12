import type { EntityEditorSelector } from '@jonasb/datadata-admin-react-components';
import {
  AddEntityDraftAction,
  DataDataContext,
  EntityEditorContainer,
  EntityEditorDispatchContext,
  EntityEditorStateContext,
  initializeEntityEditorState,
  Loader,
  reduceEntityEditorState,
} from '@jonasb/datadata-admin-react-components';
import type { Schema } from '@jonasb/datadata-core';
import { useRouter } from 'next/router';
import { useEffect, useReducer } from 'react';
import { useInitializeContext } from '../../contexts/DataDataContext';
import { urls } from '../../utils/PageUtils';

export interface EntityEditorPageProps {
  entitySelectors: EntityEditorSelector[];
}

export function EntityEditorPage({ entitySelectors }: EntityEditorPageProps): JSX.Element {
  const { contextValue } = useInitializeContext();

  if (!contextValue) {
    return <Loader />;
  }

  return (
    <DataDataContext.Provider value={contextValue}>
      <EntityEditorPageInner schema={contextValue.schema} entitySelectors={entitySelectors} />
    </DataDataContext.Provider>
  );
}

function EntityEditorPageInner({
  schema,
  entitySelectors,
}: {
  schema: Schema;
  entitySelectors: EntityEditorSelector[];
}) {
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
          className="position-fixed inset-0"
          {...{ editorState, dispatchEditorState }}
        />
      </EntityEditorStateContext.Provider>
    </EntityEditorDispatchContext.Provider>
  );
}
