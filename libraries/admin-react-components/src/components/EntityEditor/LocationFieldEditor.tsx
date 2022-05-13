import type { Location } from '@jonasb/datadata-core';
import { Button, Delete, HoverRevealContainer } from '@jonasb/datadata-design';
import React, { useCallback, useState } from 'react';
import { AdminLocationSelectorDialog } from '../AdminLocationSelectorDialog/AdminLocationSelectorDialog';
import type { FieldEditorProps } from './FieldEditor';

type Props = FieldEditorProps<Location>;

export function LocationFieldEditor({ value, onChange }: Props) {
  const [showSelector, setShowSelector] = useState(false);
  const handleShowSelector = useCallback(() => setShowSelector(true), [setShowSelector]);
  const handleDeleteClick = useCallback(() => onChange(null), [onChange]);
  const handleClose = useCallback(() => setShowSelector(false), [setShowSelector]);

  return (
    <>
      {value ? (
        <HoverRevealContainer gap={2}>
          <HoverRevealContainer.Item forceVisible flexGrow={1}>
            <Button onClick={handleShowSelector}>
              {value.lat}, {value.lng}
            </Button>
          </HoverRevealContainer.Item>
          <HoverRevealContainer.Item>
            <Delete onClick={handleDeleteClick} />
          </HoverRevealContainer.Item>
        </HoverRevealContainer>
      ) : (
        <Button onClick={handleShowSelector}>Select location</Button>
      )}
      {showSelector ? (
        <AdminLocationSelectorDialog
          show
          title="Select location"
          value={value}
          onClose={handleClose}
          onChange={onChange}
        />
      ) : null}
    </>
  );
}
