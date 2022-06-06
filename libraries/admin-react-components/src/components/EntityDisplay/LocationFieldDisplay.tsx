import type { Location } from '@jonasb/datadata-core';
import { Button } from '@jonasb/datadata-design';
import React, { useCallback, useState } from 'react';
import { PublishedLocationDisplayDialog } from '../PublishedLocationDisplayDialog/PublishedLocationDisplayDialog.js';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<Location>;

export function LocationFieldDisplay({ value }: Props) {
  const [showSelector, setShowSelector] = useState(false);
  const handleShowSelector = useCallback(() => setShowSelector(true), [setShowSelector]);
  const handleClose = useCallback(() => setShowSelector(false), [setShowSelector]);

  return (
    <>
      {value ? (
        <Button onClick={handleShowSelector} iconLeft="location">
          {value.lat}, {value.lng}
        </Button>
      ) : null}
      {showSelector && value ? (
        <PublishedLocationDisplayDialog show title="Location" value={value} onClose={handleClose} />
      ) : null}
    </>
  );
}
