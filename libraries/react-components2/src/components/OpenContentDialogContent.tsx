import type { Dispatch } from 'react';
import { useLoadContentList } from '../hooks/useLoadContentList.js';
import type { ContentListState, ContentListStateAction } from '../reducers/ContentListReducer.js';
import { ContentList } from './ContentList.js';
import { ContentListPagingButtons } from './ContentListPagingButtons.js';
import { DialogContent, DialogHeader, DialogTitle } from './ui/dialog.js';

interface Props {
  contentListState: ContentListState;
  dispatchContentList: Dispatch<ContentListStateAction>;
  onOpenEntity: (entityId: string) => void;
}

export function OpenContentDialogContent({
  contentListState,
  dispatchContentList,
  onOpenEntity,
}: Props) {
  useLoadContentList(contentListState, dispatchContentList);
  return (
    <DialogContent size="maximize">
      <DialogHeader>
        <DialogTitle>Select content</DialogTitle>
      </DialogHeader>
      <div className="flex-1 overflow-auto">
        <ContentList
          className="container h-full w-full p-2"
          contentListState={contentListState}
          showDate={contentListState.query.order === 'createdAt' ? 'createdAt' : 'updatedAt'}
          onItemClick={onOpenEntity}
        />
      </div>
      <ContentListPagingButtons
        className="border-t py-2"
        contentListState={contentListState}
        dispatchContentList={dispatchContentList}
      />
    </DialogContent>
  );
}
