import { ClassName, Delete, HoverRevealContainer, Menu, Text } from '@jonasb/datadata-design';
import type { Dispatch, MouseEvent } from 'react';
import { useCallback } from 'react';
import type {
  EntityEditorDraftState,
  EntityEditorState,
  EntityEditorStateAction,
} from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';
import { EntityEditorActions } from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';

interface Props {
  entityEditorState: Readonly<EntityEditorState>;
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>;
}

export function EntityEditorMenu({ entityEditorState, dispatchEntityEditorState }: Props) {
  const { activeEntityId } = entityEditorState;

  return (
    <Menu>
      <Menu.List>
        {entityEditorState.drafts.map((draftState) => (
          <MenuItem
            key={draftState.id}
            active={activeEntityId === draftState.id}
            draftState={draftState}
            dispatchEntityEditorState={dispatchEntityEditorState}
          />
        ))}
      </Menu.List>
    </Menu>
  );
}

function MenuItem({
  active,
  draftState,
  dispatchEntityEditorState,
}: {
  active: boolean;
  draftState: EntityEditorDraftState;
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>;
}) {
  const { id, status } = draftState;
  const handleItemClick = useCallback(
    () => dispatchEntityEditorState(new EntityEditorActions.SetActiveEntity(id, false, true)),
    [dispatchEntityEditorState, id]
  );

  const handleDeleteClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation(); // otherwise it will try to activate the entity after delete
      if (status === 'changed') {
        if (!window.confirm('The entity has unsaved changes, are you sure you want to close it?')) {
          return;
        }
      }
      dispatchEntityEditorState(new EntityEditorActions.DeleteDraft(id));
    },
    [dispatchEntityEditorState, id, status]
  );

  if (!draftState.draft) return null;
  return (
    <Menu.Item key={draftState.id}>
      <a
        id={`${draftState.id}-menuItem`}
        className={active ? ClassName['is-active'] : undefined}
        onClick={handleItemClick}
      >
        <HoverRevealContainer>
          <HoverRevealContainer.Item forceVisible flexGrow={1}>
            <Text textStyle="body2">{draftState.draft.entitySpec.name}</Text>
            <Text textStyle="body1">{draftState.draft.name || <i>Untitled</i>}</Text>
          </HoverRevealContainer.Item>
          <HoverRevealContainer.Item>
            <Delete onClick={handleDeleteClick} />
          </HoverRevealContainer.Item>
        </HoverRevealContainer>
      </a>
    </Menu.Item>
  );
}
