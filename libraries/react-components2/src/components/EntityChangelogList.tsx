import type { EntityReference, Paging } from '@dossierhq/core';
import { useCallback, useEffect, useReducer } from 'react';
import { useLoadChangelog } from '../hooks/useLoadChangelog.js';
import {
  ChangelogStateActions,
  initializeChangelogState,
  reduceChangelogState,
} from '../reducers/ChangelogReducer.js';
import { ConnectionPagingButtons } from './ConnectionPagingButtons.js';
import { DateDisplay } from './DateDisplay.js';
import { Badge } from './ui/badge.js';

interface Props {
  entity: EntityReference;
}

export function EntityChangelogList({ entity }: Props) {
  const [changelogState, dispatchChangelog] = useReducer(
    reduceChangelogState,
    {},
    initializeChangelogState,
  );

  useLoadChangelog(changelogState, dispatchChangelog);

  const entityId = entity.id; // since the entity object is not stable
  useEffect(() => {
    dispatchChangelog(
      new ChangelogStateActions.SetQuery(
        { entity: { id: entityId } },
        { partial: false, resetPagingIfModifying: true },
      ),
    );
  }, [entityId]);

  const handlePagingChange = useCallback(
    (paging: Paging, pagingAction?: 'first-page' | 'prev-page' | 'next-page' | 'last-page') => {
      dispatchChangelog(new ChangelogStateActions.SetPaging(paging, pagingAction));
    },
    [dispatchChangelog],
  );

  return (
    <div className="flex flex-col gap-1">
      {changelogState.edges?.map((edge) => {
        if (edge.node.isError()) return null;
        const event = edge.node.value;
        const entityInfo =
          'entities' in event ? event.entities.find((it) => it.id === entity.id) : null;

        let shortType: string = event.type;
        if (shortType.endsWith('Entity')) shortType = shortType.slice(0, -6);
        if (shortType.endsWith('Entities')) shortType = shortType.slice(0, -8);
        shortType = shortType.replace('And', ' & ');

        return (
          <div key={edge.cursor} className="flex items-center gap-2">
            <Badge variant="outline">{shortType}</Badge>
            <Badge variant="outline">{entityInfo ? String(entityInfo.version) : '–'}</Badge>
            <span className="text-muted-foreground grow text-sm">
              <DateDisplay date={event.createdAt} />
            </span>
          </div>
        );
      })}
      {(changelogState.connection?.pageInfo.hasNextPage ||
        changelogState.connection?.pageInfo.hasPreviousPage) && (
        <div className="flex gap-2">
          <ConnectionPagingButtons
            connection={changelogState.connection}
            pagingCount={changelogState.requestedCount}
            onPagingChange={handlePagingChange}
          />
        </div>
      )}
    </div>
  );
}
