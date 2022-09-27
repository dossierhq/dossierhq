import type { Location, PublishedEntity } from '@jonasb/datadata-core';
import { Button } from '@jonasb/datadata-design';
import { useCallback, useContext, useState } from 'react';
import { EntityDisplayDispatchContext } from '../../contexts/EntityDisplayDispatchContext.js';
import { EntityDisplayActions } from '../../reducers/EntityDisplayReducer/EntityDisplayReducer.js';
import { PublishedLocationDisplayDialog } from '../PublishedLocationDisplayDialog/PublishedLocationDisplayDialog.js';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<Location>;

export function LocationFieldDisplay({ value }: Props) {
  const [showSelector, setShowSelector] = useState(false);
  const handleShowSelector = useCallback(() => setShowSelector(true), [setShowSelector]);
  const handleClose = useCallback(() => setShowSelector(false), [setShowSelector]);

  const dispatchEntityDisplayState = useContext(EntityDisplayDispatchContext);
  const handleEntityClick = useCallback(
    (entity: PublishedEntity) => {
      dispatchEntityDisplayState(new EntityDisplayActions.AddEntity(entity.id));
    },
    [dispatchEntityDisplayState]
  );

  return (
    <>
      {value ? (
        <Button onClick={handleShowSelector} iconLeft="location">
          {value.lat}, {value.lng}
        </Button>
      ) : null}
      {showSelector && value ? (
        <PublishedLocationDisplayDialog
          show
          title="Location"
          value={value}
          onClose={handleClose}
          onEntityClick={handleEntityClick}
        />
      ) : null}
    </>
  );
}
