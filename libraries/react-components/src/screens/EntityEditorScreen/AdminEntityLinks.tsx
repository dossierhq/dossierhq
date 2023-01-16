import type { EntityReference } from '@dossierhq/core';
import { Button, Field } from '@jonasb/datadata-design';
import { useCallback, useContext, useState } from 'react';
import { AdminEntitySelectorDialog } from '../../components/AdminEntitySelectorDialog/AdminEntitySelectorDialog.js';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext.js';
import { EntityEditorDispatchContext } from '../../contexts/EntityEditorDispatchContext.js';
import { useAdminTotalCount } from '../../hooks/useAdminTotalCount.js';
import { EntityEditorActions } from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';

interface Props {
  entityReference: EntityReference;
}

export function AdminEntityLinks({ entityReference }: Props) {
  const { adminClient } = useContext(AdminDataDataContext);
  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);

  const [showDialog, setShowDialog] = useState<'linksTo' | 'linksFrom' | ''>('');
  const handleCloseDialog = useCallback(() => setShowDialog(''), []);

  const { totalCount: linksToTotal } = useAdminTotalCount(adminClient, {
    linksTo: entityReference,
  });
  const { totalCount: linksFromTotal } = useAdminTotalCount(adminClient, {
    linksFrom: entityReference,
  });

  return (
    <Field>
      <Field.Label size="small">Entity links</Field.Label>
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
          <AdminEntitySelectorDialog
            show={showDialog !== ''}
            title={showDialog === 'linksTo' ? 'Incoming links' : 'Outgoing links'}
            linksFrom={showDialog === 'linksFrom' ? entityReference : undefined}
            linksTo={showDialog === 'linksTo' ? entityReference : undefined}
            onClose={handleCloseDialog}
            onItemClick={(item) =>
              dispatchEntityEditorState(new EntityEditorActions.AddDraft({ id: item.id }))
            }
          />
        </Button.Group>
      </Field.Control>
    </Field>
  );
}
