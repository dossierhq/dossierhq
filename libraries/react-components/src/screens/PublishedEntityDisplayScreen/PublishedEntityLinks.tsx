import type { EntityReference, PublishedEntity } from '@dossierhq/core';
import { Button, Dialog2, Field } from '@dossierhq/design';
import { useCallback, useContext, useState } from 'react';
import { PublishedEntitySelectorDialog } from '../../components/PublishedEntitySelectorDialog/PublishedEntitySelectorDialog.js';
import { PublishedDossierContext } from '../../contexts/PublishedDossierContext.js';
import { usePublishedTotalCount } from '../../published/hooks/usePublishedTotalCount.js';

interface Props {
  entityReference: EntityReference;
  onItemClick: (item: PublishedEntity) => void;
}

export function PublishedEntityLinks({ entityReference, onItemClick }: Props) {
  const { publishedClient } = useContext(PublishedDossierContext);

  const [showDialog, setShowDialog] = useState<'linksTo' | 'linksFrom' | ''>('');
  const handleOpenChanged = useCallback((isOpen: boolean) => {
    if (!isOpen) setShowDialog('');
  }, []);

  const handleItemClick = useCallback(
    (item: PublishedEntity) => {
      onItemClick(item);
      setShowDialog('');
    },
    [onItemClick],
  );

  const { totalCount: linksToTotal } = usePublishedTotalCount(publishedClient, {
    linksTo: entityReference,
  });
  const { totalCount: linksFromTotal } = usePublishedTotalCount(publishedClient, {
    linksFrom: entityReference,
  });

  return (
    <Field>
      <Field.Label>Entity links</Field.Label>
      <Field.Control>
        <Button.Group hasAddons>
          <Dialog2.Trigger isOpen={showDialog !== ''} onOpenChange={handleOpenChanged}>
            <Button
              disabled={!linksToTotal}
              iconLeft="linkTo"
              title={`${linksToTotal} ${
                linksToTotal === 1 ? 'entity links' : 'entities link'
              } to this entity`}
              onClick={() => setShowDialog('linksTo')}
            >{`${linksToTotal} incoming`}</Button>
            <Button
              disabled={!linksFromTotal}
              iconLeft="linkFrom"
              title={`This entity links to ${linksFromTotal} ${
                linksFromTotal === 1 ? 'entity' : 'entities'
              }`}
              onClick={() => setShowDialog('linksFrom')}
            >{`${linksFromTotal} outgoing`}</Button>
            <PublishedEntitySelectorDialog
              title={showDialog === 'linksTo' ? 'Incoming links' : 'Outgoing links'}
              linksFrom={showDialog === 'linksFrom' ? entityReference : undefined}
              linksTo={showDialog === 'linksTo' ? entityReference : undefined}
              onItemClick={handleItemClick}
            />
          </Dialog2.Trigger>
        </Button.Group>
      </Field.Control>
    </Field>
  );
}
