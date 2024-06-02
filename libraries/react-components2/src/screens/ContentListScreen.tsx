'use client';

import { useReducer } from 'react';
import { ContentListPagingButtons } from '../components/ContentListPagingButtons.js';
import { useLoadContentList } from '../hooks/useLoadContentList.js';
import {
  initializeContentListState,
  reduceContentListState,
  type ContentListState,
} from '../reducers/ContentListReducer.js';

export function ContentListScreen() {
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceContentListState,
    { mode: 'full' },
    initializeContentListState, //TODO initialize from urlSearchParams instead
  );
  useLoadContentList(searchEntityState, dispatchSearchEntityState);

  return (
    <div className="flex h-dvh w-dvw overflow-hidden">
      <main className="flex flex-grow flex-col">
        <div className="flex-1 overflow-auto">
          <EntityList
            className="container h-full w-full p-2"
            searchEntityState={searchEntityState}
          />
        </div>
        <ContentListPagingButtons
          className="border-t py-2"
          contentListState={searchEntityState}
          dispatchContentListState={dispatchSearchEntityState}
        />
      </main>
    </div>
  );
}

function EntityList({
  className,
  searchEntityState,
}: {
  className?: string;
  searchEntityState: ContentListState;
}) {
  return (
    <ul className={className}>
      {searchEntityState.entities?.map((item) => {
        if (item.isError()) {
          return null;
        }
        return <li key={item.value.id}>{item.value.info.name}</li>;
      })}
    </ul>
  );
}
