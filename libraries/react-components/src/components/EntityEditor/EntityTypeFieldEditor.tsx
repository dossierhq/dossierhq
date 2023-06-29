import type {
  AdminEntity,
  AdminFieldSpecification,
  EntityFieldSpecification,
  EntityReference,
} from '@dossierhq/core';
import {
  Button,
  Column,
  Delete,
  HoverRevealContainer,
  Text,
  toFlexItemClassName,
} from '@dossierhq/design';
import type { MouseEvent } from 'react';
import { useCallback, useContext, useState } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import { EntityEditorDispatchContext } from '../../contexts/EntityEditorDispatchContext.js';
import { useAdminEntity } from '../../hooks/useAdminEntity.js';
import { EntityEditorActions } from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';
import { AdminEntitySelectorDialog } from '../AdminEntitySelectorDialog/AdminEntitySelectorDialog.js';
import { StatusTag } from '../StatusTag/StatusTag.js';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<EntityFieldSpecification, EntityReference>;

export function EntityTypeFieldEditor({ fieldSpec, value, validationIssues, onChange }: Props) {
  const { adminClient } = useContext(AdminDossierContext);
  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);
  const { entity, entityError: _error } = useAdminEntity(adminClient, value ?? undefined);

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

  return (
    <>
      {entity ? (
        <HoverRevealContainer gap={2}>
          <HoverRevealContainer.Item forceVisible flexGrow={1}>
            <Text textStyle="body2" marginBottom={0}>
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
        <AddEntityButton fieldSpec={fieldSpec} onEntitySelected={onChange} />
      )}
      {validationIssues.map((error, index) => (
        <Text key={index} textStyle="body2" marginTop={1} color="danger">
          {error.message}
        </Text>
      ))}
    </>
  );
}

export function EntityTypeFieldEditorWithoutClear({
  className,
  value,
}: {
  className?: string;
  value: EntityReference;
}) {
  const { adminClient } = useContext(AdminDossierContext);
  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);
  const { entity, entityError: _error } = useAdminEntity(adminClient, value ?? undefined);

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

  if (!entity) return null;

  return (
    <Column className={className}>
      <Column.Item flexGrow={1}>
        <Text textStyle="body2" marginBottom={0}>
          {entity.info.type}
        </Text>
        <Text textStyle="body1">
          <a onClick={handleEntityClick}>{entity.info.name}</a>
        </Text>
      </Column.Item>
      <Column.Item>
        <StatusTag status={entity.info.status} />
      </Column.Item>
    </Column>
  );
}

export function AddEntityListItemButton({
  fieldSpec,
  onChange,
  value,
}: {
  fieldSpec: AdminFieldSpecification<EntityFieldSpecification>;
  onChange: (value: (EntityReference | null)[]) => void;
  value: (EntityReference | null)[] | null;
}) {
  const handleEntitySelected = useCallback(
    (entity: EntityReference) => onChange(value ? [...value, entity] : [entity]),
    [onChange, value]
  );
  return <AddEntityButton fieldSpec={fieldSpec} onEntitySelected={handleEntitySelected} />;
}

function AddEntityButton({
  fieldSpec,
  onEntitySelected,
}: {
  fieldSpec: AdminFieldSpecification<EntityFieldSpecification>;
  onEntitySelected: (entity: EntityReference) => void;
}) {
  const [showSelector, setShowSelector] = useState(false);

  const handleItemClick = useCallback(
    (item: AdminEntity) => {
      onEntitySelected({ id: item.id });
      setShowSelector(false);
    },
    [onEntitySelected]
  );
  const handleDialogClose = useCallback(() => setShowSelector(false), []);

  const handleSelectClick = useCallback(() => setShowSelector(true), []);
  return (
    <>
      <Button
        className={toFlexItemClassName({ alignSelf: 'flex-start' })}
        onClick={handleSelectClick}
      >
        Select entity
      </Button>
      {showSelector ? (
        <AdminEntitySelectorDialog
          show
          title="Select entity"
          entityTypes={fieldSpec.entityTypes}
          onClose={handleDialogClose}
          onItemClick={handleItemClick}
        />
      ) : null}
    </>
  );
}
