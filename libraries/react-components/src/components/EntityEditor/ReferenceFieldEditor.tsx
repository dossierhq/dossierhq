import type { Entity, EntityReference, ReferenceFieldSpecification } from '@dossierhq/core';
import {
  Button2,
  Column,
  Delete,
  Dialog2,
  HoverRevealContainer,
  Tag,
  Text,
  toFlexItemClassName,
} from '@dossierhq/design';
import { useCallback, useContext, useState, type MouseEvent } from 'react';
import { DossierContext } from '../../contexts/DossierContext.js';
import { EntityEditorDispatchContext } from '../../contexts/EntityEditorDispatchContext.js';
import { useAdminEntity } from '../../hooks/useAdminEntity.js';
import { EntityEditorActions } from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';
import { AdminEntitySelectorDialog } from '../AdminEntitySelectorDialog/AdminEntitySelectorDialog.js';
import { StatusTag } from '../StatusTag/StatusTag.js';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<ReferenceFieldSpecification, EntityReference>;

export function ReferenceFieldEditor({
  fieldSpec,
  value,
  validationIssues,
  dragHandle,
  onChange,
}: Props) {
  const { client } = useContext(DossierContext);
  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);
  const { entity, entityError: _error } = useAdminEntity(client, value ?? undefined);

  const handleEntityClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      if (!value) return;
      // open entity asynchronously to not fight with the "click to activate entity" functionality
      setTimeout(() =>
        dispatchEntityEditorState(new EntityEditorActions.AddDraft({ id: value.id })),
      );
    },
    [dispatchEntityEditorState, value],
  );
  const handleDeleteClick = useCallback(() => onChange(null), [onChange]);

  return (
    <>
      {entity ? (
        <HoverRevealContainer gap={2}>
          {dragHandle ? (
            <HoverRevealContainer.Item forceVisible alignSelf="center">
              {dragHandle}
            </HoverRevealContainer.Item>
          ) : null}
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
            {!entity.info.valid || entity.info.validPublished === false ? (
              <>
                {' '}
                <Tag color="danger">Invalid</Tag>
              </>
            ) : null}
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

export function ReferenceFieldEditorWithoutClear({
  className,
  value,
}: {
  className?: string;
  value: EntityReference;
}) {
  const { client } = useContext(DossierContext);
  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);
  const { entity, entityError: _error } = useAdminEntity(client, value ?? undefined);

  const handleEntityClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      if (!value) return;
      // open entity asynchronously to not fight with the "click to activate entity" functionality
      setTimeout(() =>
        dispatchEntityEditorState(new EntityEditorActions.AddDraft({ id: value.id })),
      );
    },
    [dispatchEntityEditorState, value],
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
        {!entity.info.valid || entity.info.validPublished === false ? (
          <>
            {' '}
            <Tag color="danger">Invalid</Tag>
          </>
        ) : null}
      </Column.Item>
    </Column>
  );
}

export function AddEntityListItemButton({
  fieldSpec,
  onAddItem,
}: {
  fieldSpec: ReferenceFieldSpecification;
  onAddItem: (value: EntityReference | null) => void;
}) {
  return <AddEntityButton fieldSpec={fieldSpec} onEntitySelected={onAddItem} />;
}

function AddEntityButton({
  fieldSpec,
  onEntitySelected,
}: {
  fieldSpec: ReferenceFieldSpecification;
  onEntitySelected: (entity: EntityReference) => void;
}) {
  const [showSelector, setShowSelector] = useState(false);

  const handleItemClick = useCallback(
    (item: Entity) => {
      onEntitySelected({ id: item.id });
      setShowSelector(false);
    },
    [onEntitySelected],
  );

  const handleSelectClick = useCallback(() => setShowSelector(true), []);

  return (
    <Dialog2.Trigger isOpen={showSelector} onOpenChange={setShowSelector}>
      <Button2
        className={toFlexItemClassName({ alignSelf: 'flex-start' })}
        onClick={handleSelectClick}
      >
        Select entity
      </Button2>
      {showSelector ? (
        <AdminEntitySelectorDialog
          title="Select entity"
          entityTypes={fieldSpec.entityTypes}
          onItemClick={handleItemClick}
        />
      ) : null}
    </Dialog2.Trigger>
  );
}
