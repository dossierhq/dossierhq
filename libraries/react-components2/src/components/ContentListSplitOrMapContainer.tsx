import { EntityQueryOrder, type Schema } from '@dossierhq/core';
import { lazy, Suspense, useState, type Dispatch } from 'react';
import type { ContentListState, ContentListStateAction } from '../reducers/ContentListReducer.js';
import { ContentList } from './ContentList.js';
import { ContentListPagingButtons } from './ContentListPagingButtons.js';
import { EntityDisplay } from './EntityDisplay.js';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable.js';

const ContentMap = lazy(() => import('./ContentMap.js').then((it) => ({ default: it.ContentMap })));
const ContentMapMarker = lazy(() =>
  import('./ContentMapMarker.js').then((it) => ({ default: it.ContentMapMarker })),
);

export function ContentListSplitOrMapContainer({
  schema,
  lg,
  contentListState,
  dispatchContentList,
  onOpenEntity,
}: {
  schema: Schema | undefined;
  lg: boolean;
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
  onOpenEntity: (id: string) => void;
}) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const showDate =
    contentListState.query.order === EntityQueryOrder.createdAt ? 'createdAt' : 'updatedAt';

  if (contentListState.viewMode === 'list') {
    return (
      <>
        <div className="flex-1 overflow-auto">
          <ContentList
            className="container min-h-full w-full p-2"
            contentListState={contentListState}
            showDate={showDate}
            onItemClick={onOpenEntity}
          />
        </div>
        <ContentListPagingButtons
          className="border-t py-2"
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
        />
      </>
    );
  }

  return (
    (contentListState.viewMode === 'split' || contentListState.viewMode === 'map') && (
      <ResizablePanelGroup direction={lg ? 'horizontal' : 'vertical'}>
        <ResizablePanel minSize={20}>
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-auto">
              <ContentList
                className="min-h-full w-full p-2"
                contentListState={contentListState}
                selectedItem={contentListState.viewMode === 'split' ? selectedEntityId : null}
                onItemClick={
                  contentListState.viewMode === 'split' ? setSelectedEntityId : onOpenEntity
                }
                showDate={showDate}
              />
              {!lg && (
                <ContentListPagingButtons
                  className="border-t py-2"
                  contentListState={contentListState}
                  dispatchContentList={dispatchContentList}
                />
              )}
            </div>
            {lg && (
              <ContentListPagingButtons
                className="border-t py-2"
                contentListState={contentListState}
                dispatchContentList={dispatchContentList}
              />
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel minSize={20}>
          {contentListState.viewMode === 'split' &&
            ((contentListState.entities && contentListState.entities.length > 0) ||
              selectedEntityId) && (
              <EntityDisplay
                className="h-full w-full overflow-auto p-2"
                entityId={selectedEntityId}
              />
            )}
          {contentListState.viewMode === 'map' && !!schema ? (
            <Suspense>
              <ContentMap
                className="h-full"
                schema={schema}
                contentListState={contentListState}
                dispatchContentList={dispatchContentList}
                renderEntityMarker={(key, entity, location) => (
                  <ContentMapMarker
                    key={key}
                    entity={entity}
                    location={location}
                    onClick={() => onOpenEntity(entity.id)}
                  />
                )}
              />
            </Suspense>
          ) : null}
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  );
}
