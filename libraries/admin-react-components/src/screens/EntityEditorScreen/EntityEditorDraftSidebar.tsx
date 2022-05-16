import { assertIsDefined } from '@jonasb/datadata-core';
import { Text } from '@jonasb/datadata-design';
import React from 'react';
import { StatusTag } from '../../components/StatusTag/StatusTag';
import type { EntityEditorState } from '../../reducers/EntityEditorReducer/EntityEditorReducer';

interface Props {
  entityEditorState: EntityEditorState;
}

export function EntityEditorDraftSidebar({ entityEditorState }: Props) {
  const { activeEntityId } = entityEditorState;

  if (!activeEntityId) return null;
  const draftState = entityEditorState.drafts.find((it) => it.id === activeEntityId);
  assertIsDefined(draftState);

  const { draft, entity } = draftState;

  if (!draft) return null;

  return (
    <>
      <Text textStyle="headline6">{draft.name}</Text>
      {entity ? (
        <>
          <Text textStyle="body2">{entity.id}</Text>
          <StatusTag status={entity.info.status} />
        </>
      ) : null}
    </>
  );
}
