import type { AdminEntity, EntityReference } from '@jonasb/datadata-core';
import { Button, Delete, HoverRevealContainer, Text } from '@jonasb/datadata-design';
import type { MouseEvent } from 'react';
import React, { useCallback, useContext, useState } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { EntityEditorDispatchContext } from '../../contexts/EntityEditorDispatchContext';
import { useAdminEntity } from '../../hooks/useAdminEntity';
import { EntityEditorActions } from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import { AdminEntitySelectorDialog } from '../AdminEntitySelectorDialog/AdminEntitySelectorDialog';
import { StatusTag } from '../StatusTag/StatusTag';
import type { FieldEditorProps } from './FieldEditor';

type Props = FieldEditorProps<EntityReference>;

export function EntityTypeFieldEditor({ value, onChange }: Props) {
  const { adminClient } = useContext(AdminDataDataContext);
  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);
  const { entity, entityError: _error } = useAdminEntity(adminClient, value ?? undefined);

  const [showSelector, setShowSelector] = useState(false);

  const handleEntityClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      if (!value) return;
      // open entity asynchronously to not fight with the "click to activate entity" functionality
      setTimeout(() =>
        dispatchEntityEditorState(new EntityEditorActions.AddDraft({ id: value.id }))
      );
    },
    [dispatchEntityEditorState, value]
  );
  const handleDeleteClick = useCallback(() => onChange(null), [onChange]);
  const handleSelectClick = useCallback(() => setShowSelector(true), []);
  const handleItemClick = useCallback(
    (item: AdminEntity) => {
      onChange({ id: item.id });
      setShowSelector(false);
    },
    [onChange]
  );
  const handleDialogClose = useCallback(() => setShowSelector(false), []);

  return (
    <>
      {entity ? (
        <HoverRevealContainer gap={2}>
          <HoverRevealContainer.Item forceVisible flexGrow={1}>
            <Text textStyle="body2" noBottomMargin>
              {entity.info.type}
            </Text>
            <Text textStyle="body1">
              <a onClick={handleEntityClick}>{entity.info.name}</a>
            </Text>
          </HoverRevealContainer.Item>
          <HoverRevealContainer.Item forceVisible>
            <StatusTag status={entity.info.status} />
          </HoverRevealContainer.Item>
          <HoverRevealContainer.Item paddingTop={1}>
            <Delete onClick={handleDeleteClick} />
          </HoverRevealContainer.Item>
        </HoverRevealContainer>
      ) : (
        <Button onClick={handleSelectClick}>Select entity</Button>
      )}
      {showSelector ? (
        <AdminEntitySelectorDialog
          show
          title="Select entity"
          onClose={handleDialogClose}
          onItemClick={handleItemClick}
        />
      ) : null}
    </>
  );
}
