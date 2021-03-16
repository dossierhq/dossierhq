import type { EntityEditorSelector } from '@datadata/admin-react-components';
import {
  AddEntityDraftAction,
  DataDataContext,
  EntityEditorContainer,
  initializeEntityEditorState,
  reduceEntityEditorState,
} from '@datadata/admin-react-components';
import type { Schema } from '@datadata/core';
import { useRouter } from 'next/router';
import { useEffect, useReducer, useState } from 'react';
import { useInitializeContext } from '../../contexts/DataDataContext';
import { urls } from '../../utils/PageUtils';

export interface EntityEditorPageProps {
  entitySelectors: EntityEditorSelector[];
}

export function EntityEditorPage({ entitySelectors }: EntityEditorPageProps): JSX.Element {
  const { contextValue } = useInitializeContext();

  return (
    <DataDataContext.Provider value={contextValue}>
      {contextValue ? (
        <EntityEditorPageInner schema={contextValue.schema} entitySelectors={entitySelectors} />
      ) : null}
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
  const [hasAddedInitialDrafts, setHasAddedInitialDrafts] = useState(false);
  const [editorState, dispatchEditorState] = useReducer(
    reduceEntityEditorState,
    { schema },
    initializeEntityEditorState
  );

  useEffect(() => {
    for (const entitySelector of entitySelectors) {
      dispatchEditorState(new AddEntityDraftAction(entitySelector));
    }
    setHasAddedInitialDrafts(true);
  }, []);

  const ids = editorState.drafts.map((x) => x.id);
  useEffect(() => {
    const url = urls.editPage(ids);
    if (hasAddedInitialDrafts && url !== router.asPath) {
      router.replace(url);
    }
  }, [hasAddedInitialDrafts, ids]);

  return <EntityEditorContainer {...{ editorState, dispatchEditorState }} />;
}
