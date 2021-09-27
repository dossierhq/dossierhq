import type { EntityEditorSelector } from '@jonasb/datadata-admin-react-components';
import {
  AddEntityDraftAction,
  DataDataContext,
  EntityEditorContainer,
  EntityEditorDispatchContext,
  EntityEditorStateContext,
  initializeEntityEditorState,
  reduceEntityEditorState,
  WaitForDataDataContext,
} from '@jonasb/datadata-admin-react-components';
import { FullscreenContainer } from '@jonasb/datadata-design';
import { useRouter } from 'next/router';
import { useContext, useEffect, useReducer } from 'react';
import { DataDataSharedProvider } from '../../contexts/DataDataSharedProvider';
import { urls } from '../../utils/PageUtils';
import { NavBar } from '../NavBar/NavBar';

export interface EntityEditorPageProps {
  entitySelectors: EntityEditorSelector[];
}

export function EntityEditorPage({ entitySelectors }: EntityEditorPageProps): JSX.Element {
  return (
    <DataDataSharedProvider>
      <WaitForDataDataContext>
        <EntityEditorPageInner entitySelectors={entitySelectors} />
      </WaitForDataDataContext>
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
        <FullscreenContainer>
          <FullscreenContainer.Row fullWidth>
            <NavBar current="entities" />
          </FullscreenContainer.Row>
          <FullscreenContainer.Row fillHeight fullWidth>
            <EntityEditorContainer />
          </FullscreenContainer.Row>
        </FullscreenContainer>
      </EntityEditorStateContext.Provider>
    </EntityEditorDispatchContext.Provider>
  );
}
