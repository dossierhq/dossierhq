import type { EntityReference } from '@dossierhq/core';
import { ArrowDownLeftIcon, ArrowUpRightIcon } from 'lucide-react';
import { useCallback, useContext, useReducer, useState } from 'react';
import { ContentEditorDispatchContext } from '../contexts/ContentEditorDispatchContext.js';
import { useEntitiesTotalCount } from '../hooks/useEntitiesTotalCount.js';
import { ContentEditorActions } from '../reducers/ContentEditorReducer.js';
import {
  initializeContentListState,
  reduceContentListState,
} from '../reducers/ContentListReducer.js';
import { OpenContentDialogContent } from './OpenContentDialogContent.js';
import { Button } from './ui/button.js';
import { Dialog } from './ui/dialog.js';

interface Props {
  entityReference: EntityReference;
}

export function EntityLinks({ entityReference }: Props) {
  const dispatchContentEditor = useContext(ContentEditorDispatchContext);

  const [showDialog, setShowDialog] = useState<'linksTo' | 'linksFrom' | ''>('');
  const handleOpenChanged = useCallback((isOpen: boolean) => {
    if (!isOpen) setShowDialog('');
  }, []);

  const { totalCount: linksToTotal } = useEntitiesTotalCount({ linksTo: entityReference });
  const { totalCount: linksFromTotal } = useEntitiesTotalCount({ linksFrom: entityReference });

  if (!linksToTotal && !linksFromTotal) {
    return null;
  }

  return (
    <div className="flex justify-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={!linksToTotal}
        title={`${linksToTotal} ${linksToTotal === 1 ? 'entity links' : 'entities link'} to this entity`}
        onClick={() => setShowDialog('linksTo')}
      >
        <ArrowDownLeftIcon />
        {`${linksToTotal ?? 0} incoming`}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={!linksFromTotal}
        title={`This entity links to ${linksFromTotal} ${linksFromTotal === 1 ? 'entity' : 'entities'}`}
        onClick={() => setShowDialog('linksFrom')}
      >
        <ArrowUpRightIcon />
        {`${linksFromTotal ?? 0} outgoing`}
      </Button>
      {showDialog !== '' ? (
        <Dialog open onOpenChange={handleOpenChanged}>
          <EntityLinksDialogContent
            key={showDialog}
            direction={showDialog}
            entityReference={entityReference}
            onOpenEntity={(entityId) => {
              dispatchContentEditor(new ContentEditorActions.AddDraft({ id: entityId }));
              setShowDialog('');
            }}
          />
        </Dialog>
      ) : null}
    </div>
  );
}

function EntityLinksDialogContent({
  direction,
  entityReference,
  onOpenEntity,
}: {
  direction: 'linksTo' | 'linksFrom';
  entityReference: EntityReference;
  onOpenEntity: (entityId: string) => void;
}) {
  const [contentListState, dispatchContentList] = useReducer(
    reduceContentListState,
    {
      mode: 'full' as const,
      restrictLinksTo: direction === 'linksTo' ? entityReference : undefined,
      restrictLinksFrom: direction === 'linksFrom' ? entityReference : undefined,
    },
    initializeContentListState,
  );

  return (
    <OpenContentDialogContent
      title={direction === 'linksTo' ? 'Incoming links' : 'Outgoing links'}
      contentListState={contentListState}
      dispatchContentList={dispatchContentList}
      onOpenEntity={onOpenEntity}
    />
  );
}
