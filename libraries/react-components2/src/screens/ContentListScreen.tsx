'use client';

import { useReducer } from 'react';
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

  if (searchEntityState.connection === undefined) {
    return <div>Loading...</div>;
  }
  if (searchEntityState.connection === null) {
    return <div>No matches</div>;
  }

  return (
    <div className="flex h-dvh w-dvw overflow-hidden">
      <main className="flex flex-grow flex-col">
        <div className="flex-1 overflow-auto">
          <EntityList
            className="container h-full w-full p-2"
            searchEntityState={searchEntityState}
          />
        </div>
        {/* <PagingButtons className="border-t py-2" /> */}
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
      {searchEntityState.connection?.edges.map((edge) => {
        if (edge.node.isError())
          return (
            <li key={edge.cursor}>
              {edge.node.error} - {edge.node.message}
            </li>
          );
        return <li key={edge.cursor}>{edge.node.value.info.name}</li>;
      })}
    </ul>
  );
}
