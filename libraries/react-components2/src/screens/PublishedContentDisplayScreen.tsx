'use client';

import { SearchIcon, XIcon } from 'lucide-react';
import { useEffect, useReducer, useState, type Dispatch } from 'react';
import { EmptyStateMessage } from '../components/EmptyStateMessage.js';
import { EntityDisplay } from '../components/EntityDisplay.js';
import { OpenContentDialogContent } from '../components/OpenContentDialogContent.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { Button } from '../components/ui/button.js';
import { Dialog } from '../components/ui/dialog.js';
import { DisplayModeContext } from '../contexts/DisplayModeContext.js';
import {
  ContentDisplayActions,
  reduceContentDisplayState,
  type ContentDisplayStateAction,
} from '../reducers/ContentDisplayReducer.js';
import {
  initializeContentDisplayStateFromUrlQuery,
  useContentDisplayCallOnUrlSearchQueryParamChange,
} from '../reducers/ContentDisplayUrlSynchronizer.js';
import {
  initializeContentListState,
  reduceContentListState,
} from '../reducers/ContentListReducer.js';

export function PublishedContentDisplayScreen({
  urlSearchParams,
  onUrlSearchParamsChange,
}: {
  urlSearchParams?: Readonly<URLSearchParams> | null;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
}) {
  const [contentDisplayState, dispatchContentDisplay] = useReducer(
    reduceContentDisplayState,
    urlSearchParams,
    initializeContentDisplayStateFromUrlQuery,
  );
  useContentDisplayCallOnUrlSearchQueryParamChange(contentDisplayState, onUrlSearchParamsChange);

  const { entityIds, activeEntityId, activeEntityDisplayScrollSignal } = contentDisplayState;

  const entityDisplayAndSignal = activeEntityId
    ? `${activeEntityId} ${activeEntityDisplayScrollSignal}`
    : null;
  useEffect(() => {
    if (!entityDisplayAndSignal) return;
    const [entityId, _signal] = entityDisplayAndSignal.split(' ');
    const element = document.getElementById(`entity-${entityId}-display`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [entityDisplayAndSignal]);

  return (
    <DisplayModeContext.Provider value="published">
      <div className="flex h-dvh w-dvw flex-col overflow-hidden">
        <Toolbar dispatchContentDisplay={dispatchContentDisplay} />
        {entityIds.length === 0 ? (
          <div className="flex grow flex-col items-center justify-center p-2">
            <EmptyStateMessage
              className="w-full max-w-96"
              icon={<SearchIcon />}
              title="No open entities"
              description="Open an entity to view its published content"
            />
          </div>
        ) : (
          <div className="overflow-auto">
            <div className="container flex flex-col gap-2 p-2">
              {entityIds.map((entityId) => (
                <div key={entityId} className="relative">
                  <span id={`entity-${entityId}-display`} />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close"
                    className="absolute top-2 right-2 z-10 size-6"
                    onClick={() =>
                      dispatchContentDisplay(new ContentDisplayActions.RemoveEntity(entityId))
                    }
                  >
                    <XIcon />
                  </Button>
                  <EntityDisplay entityId={entityId} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DisplayModeContext.Provider>
  );
}

function Toolbar({
  dispatchContentDisplay,
}: {
  dispatchContentDisplay: Dispatch<ContentDisplayStateAction>;
}) {
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  return (
    <div className="flex items-center border-b">
      <div className="container flex gap-2 p-2">
        <Button variant="secondary" onClick={() => setShowOpenDialog(true)}>
          Open
        </Button>
        <div className="grow" />
        <ThemeToggle />
      </div>
      {showOpenDialog ? (
        <Dialog open onOpenChange={setShowOpenDialog}>
          <PublishedOpenDialogContent
            onOpenEntity={(entityId) => {
              dispatchContentDisplay(new ContentDisplayActions.AddEntity(entityId));
              setShowOpenDialog(false);
            }}
          />
        </Dialog>
      ) : null}
    </div>
  );
}

function PublishedOpenDialogContent({
  onOpenEntity,
}: {
  onOpenEntity: (entityId: string) => void;
}) {
  const [contentListState, dispatchContentList] = useReducer(
    reduceContentListState,
    { mode: 'published' as const },
    initializeContentListState,
  );
  return (
    <OpenContentDialogContent
      contentListState={contentListState}
      dispatchContentList={dispatchContentList}
      onOpenEntity={onOpenEntity}
    />
  );
}
