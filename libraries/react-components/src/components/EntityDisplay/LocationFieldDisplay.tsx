import type {
  Location,
  PublishedEntity,
  PublishedLocationFieldSpecification,
} from '@dossierhq/core';
import { Button2, Dialog2 } from '@dossierhq/design';
import { useCallback, useContext, useState } from 'react';
import { EntityDisplayDispatchContext } from '../../contexts/EntityDisplayDispatchContext.js';
import { EntityDisplayActions } from '../../reducers/EntityDisplayReducer/EntityDisplayReducer.js';
import { PublishedLocationDisplayDialog } from '../PublishedLocationDisplayDialog/PublishedLocationDisplayDialog.js';
import type { FieldDisplayProps } from './FieldDisplay.js';

type Props = FieldDisplayProps<PublishedLocationFieldSpecification, Location>;

export function LocationFieldDisplay({ value }: Props) {
  const [showSelector, setShowSelector] = useState(false);
  const handleShowSelector = useCallback(() => setShowSelector(true), [setShowSelector]);

  const dispatchEntityDisplayState = useContext(EntityDisplayDispatchContext);
  const handleEntityClick = useCallback(
    (entity: PublishedEntity) => {
      dispatchEntityDisplayState(new EntityDisplayActions.AddEntity(entity.id));
    },
    [dispatchEntityDisplayState],
  );

  return value ? (
    <Dialog2.Trigger isOpen={showSelector} onOpenChange={setShowSelector}>
      <Button2 onClick={handleShowSelector} iconLeft="location">
        {value.lat}, {value.lng}
      </Button2>
      <PublishedLocationDisplayDialog
        title="Location"
        value={value}
        onEntityClick={handleEntityClick}
      />
    </Dialog2.Trigger>
  ) : null;
}
