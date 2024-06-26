import type { Entity, Location, LocationFieldSpecification } from '@dossierhq/core';
import {
  Button2,
  Delete,
  Dialog2,
  HoverRevealContainer,
  Row,
  Text,
  toFlexItemClassName,
} from '@dossierhq/design';
import { useCallback, useContext, useState } from 'react';
import { EntityEditorDispatchContext } from '../../contexts/EntityEditorDispatchContext.js';
import {
  EntityEditorActions,
  type EntityEditorDraftState,
} from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';
import { AdminLocationSelectorDialog } from '../AdminLocationSelectorDialog/AdminLocationSelectorDialog.js';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<LocationFieldSpecification, Location>;

export function LocationFieldEditor({ value, validationIssues, dragHandle, onChange }: Props) {
  const [showSelector, setShowSelector] = useState(false);
  const handleShowSelector = useCallback(() => setShowSelector(true), [setShowSelector]);
  const handleDeleteClick = useCallback(() => onChange(null), [onChange]);

  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);
  const handleItemClick = useCallback(
    (item: Entity | EntityEditorDraftState) => {
      dispatchEntityEditorState(new EntityEditorActions.AddDraft({ id: item.id }));
    },
    [dispatchEntityEditorState],
  );

  return (
    <Dialog2.Trigger isOpen={showSelector} onOpenChange={setShowSelector}>
      {value ? (
        <HoverRevealContainer gap={2}>
          {dragHandle ? (
            <HoverRevealContainer.Item forceVisible alignSelf="center">
              {dragHandle}
            </HoverRevealContainer.Item>
          ) : null}
          <HoverRevealContainer.Item forceVisible flexGrow={1}>
            <Button2 onClick={handleShowSelector} iconLeft="location">
              {value.lat}, {value.lng}
            </Button2>
          </HoverRevealContainer.Item>
          <HoverRevealContainer.Item>
            <Delete onClick={handleDeleteClick} />
          </HoverRevealContainer.Item>
        </HoverRevealContainer>
      ) : dragHandle ? (
        <Row gap={2}>
          {dragHandle}
          <Button2 onClick={handleShowSelector} iconLeft="map">
            Select location
          </Button2>
        </Row>
      ) : (
        <Button2 onClick={handleShowSelector} iconLeft="map">
          Select location
        </Button2>
      )}
      {validationIssues.map((error, index) => (
        <Text key={index} textStyle="body2" marginTop={1} color="danger">
          {error.message}
        </Text>
      ))}
      <AdminLocationSelectorDialog
        title="Select location"
        value={value}
        onChange={onChange}
        onItemClick={handleItemClick}
      />
    </Dialog2.Trigger>
  );
}

export function AddLocationListItemButton({
  onAddItem,
}: {
  onAddItem: (value: Location | null) => void;
}) {
  return (
    <Button2
      className={toFlexItemClassName({ alignSelf: 'flex-start' })}
      onClick={() => onAddItem(null)}
    >
      Add
    </Button2>
  );
}
