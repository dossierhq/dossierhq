import type { EntityReference } from '@dossierhq/core';
import { Button, ButtonGroup, Dialog2, Field } from '@dossierhq/design';
import { useCallback, useContext, useState } from 'react';
import { AdminEntitySelectorDialog } from '../../components/AdminEntitySelectorDialog/AdminEntitySelectorDialog.js';
import { DossierContext } from '../../contexts/DossierContext.js';
import { EntityEditorDispatchContext } from '../../contexts/EntityEditorDispatchContext.js';
import { useAdminEntitiesTotalCount } from '../../hooks/useAdminEntitiesTotalCount.js';
import { EntityEditorActions } from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';

interface Props {
  entityReference: EntityReference;
}

export function AdminEntityLinks({ entityReference }: Props) {
  const { client } = useContext(DossierContext);
  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);

  const [showDialog, setShowDialog] = useState<'linksTo' | 'linksFrom' | ''>('');
  const handleOpenChanged = useCallback((isOpen: boolean) => {
    if (!isOpen) setShowDialog('');
  }, []);

  const { totalCount: linksToTotal } = useAdminEntitiesTotalCount(client, {
    linksTo: entityReference,
  });
  const { totalCount: linksFromTotal } = useAdminEntitiesTotalCount(client, {
    linksFrom: entityReference,
  });

  return (
    <Field>
      <Field.Label size="small">Entity links</Field.Label>
      <Field.Control>
        <ButtonGroup hasAddons>
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
            <AdminEntitySelectorDialog
              title={showDialog === 'linksTo' ? 'Incoming links' : 'Outgoing links'}
              linksFrom={showDialog === 'linksFrom' ? entityReference : undefined}
              linksTo={showDialog === 'linksTo' ? entityReference : undefined}
              onItemClick={(item) =>
                dispatchEntityEditorState(new EntityEditorActions.AddDraft({ id: item.id }))
              }
            />
          </Dialog2.Trigger>
        </ButtonGroup>
      </Field.Control>
    </Field>
  );
}
