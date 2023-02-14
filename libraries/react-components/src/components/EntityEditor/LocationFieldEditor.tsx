import type { AdminEntity, Location, LocationFieldSpecification } from '@dossierhq/core';
import { Button, Delete, HoverRevealContainer, Text } from '@dossierhq/design';
import { useCallback, useContext, useState } from 'react';
import { EntityEditorDispatchContext } from '../../contexts/EntityEditorDispatchContext.js';
import type { EntityEditorDraftState } from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';
import { EntityEditorActions } from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';
import { AdminLocationSelectorDialog } from '../AdminLocationSelectorDialog/AdminLocationSelectorDialog.js';
import type { FieldEditorProps } from './FieldEditor.js';

type Props = FieldEditorProps<LocationFieldSpecification, Location>;

export function LocationFieldEditor({ value, validationErrors, onChange }: Props) {
  const [showSelector, setShowSelector] = useState(false);
  const handleShowSelector = useCallback(() => setShowSelector(true), [setShowSelector]);
  const handleDeleteClick = useCallback(() => onChange(null), [onChange]);
  const handleClose = useCallback(() => setShowSelector(false), [setShowSelector]);

  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);
  const handleItemClick = useCallback(
    (item: AdminEntity | EntityEditorDraftState) => {
      dispatchEntityEditorState(new EntityEditorActions.AddDraft({ id: item.id }));
    },
    [dispatchEntityEditorState]
  );

  return (
    <>
      {value ? (
        <HoverRevealContainer gap={2}>
          <HoverRevealContainer.Item forceVisible flexGrow={1}>
            <Button onClick={handleShowSelector} iconLeft="location">
              {value.lat}, {value.lng}
            </Button>
          </HoverRevealContainer.Item>
          <HoverRevealContainer.Item>
            <Delete onClick={handleDeleteClick} />
          </HoverRevealContainer.Item>
        </HoverRevealContainer>
      ) : (
        <Button onClick={handleShowSelector} iconLeft="map">
          Select location
        </Button>
      )}
      {showSelector ? (
        <AdminLocationSelectorDialog
          show
          title="Select location"
          value={value}
          onClose={handleClose}
          onChange={onChange}
          onItemClick={handleItemClick}
        />
      ) : null}
      {validationErrors.map((error, index) => (
        <Text key={index} textStyle="body2" marginTop={1} color="danger">
          {error.message}
        </Text>
      ))}
    </>
  );
}
