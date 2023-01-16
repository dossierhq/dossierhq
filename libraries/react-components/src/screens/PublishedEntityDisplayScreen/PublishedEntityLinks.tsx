import type { EntityReference, PublishedEntity } from '@dossierhq/core';
import { Button, Field } from '@dossierhq/design';
import { useCallback, useContext, useState } from 'react';
import { PublishedEntitySelectorDialog } from '../../components/PublishedEntitySelectorDialog/PublishedEntitySelectorDialog.js';
import { PublishedDataDataContext } from '../../published/contexts/PublishedDataDataContext.js';
import { usePublishedTotalCount } from '../../published/hooks/usePublishedTotalCount.js';

interface Props {
  entityReference: EntityReference;
  onItemClick: (item: PublishedEntity) => void;
}

export function PublishedEntityLinks({ entityReference, onItemClick }: Props) {
  const { publishedClient } = useContext(PublishedDataDataContext);

  const [showDialog, setShowDialog] = useState<'linksTo' | 'linksFrom' | ''>('');
  const handleCloseDialog = useCallback(() => setShowDialog(''), []);
  const handleItemClick = useCallback(
    (item: PublishedEntity) => {
      onItemClick(item);
      handleCloseDialog();
    },
    [handleCloseDialog, onItemClick]
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
            show={showDialog !== ''}
            title={showDialog === 'linksTo' ? 'Incoming links' : 'Outgoing links'}
            linksFrom={showDialog === 'linksFrom' ? entityReference : undefined}
            linksTo={showDialog === 'linksTo' ? entityReference : undefined}
            onClose={handleCloseDialog}
            onItemClick={handleItemClick}
          />
        </Button.Group>
      </Field.Control>
    </Field>
  );
}
