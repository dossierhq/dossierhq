import type { EntityReference } from '@dossierhq/core';
import { DateDisplay, Row, Tag } from '@dossierhq/design';
import { useEffect, useReducer } from 'react';
import { useAdminLoadChangelog } from '../../hooks/useAdminLoadChangelog.js';
import {
  ChangelogStateActions,
  initializeChangelogState,
  reduceChangelogState,
} from '../../reducers/ChangelogReducer/ChangelogReducer.js';
import { ChangelogConnectionButtons } from '../ChangelogConnectionButtons/ChangelogConnectionButtons.js';

interface Props {
  entity: EntityReference;
}

export function EntityChangelogList({ entity }: Props) {
  const [changelogState, dispatchChangelogState] = useReducer(
    reduceChangelogState,
    {},
    initializeChangelogState,
  );

  useAdminLoadChangelog(changelogState, dispatchChangelogState);

  const entityId = entity.id; // since the entity object is not stable
  useEffect(() => {
    dispatchChangelogState(
      new ChangelogStateActions.SetQuery(
        { entity: { id: entityId } },
        { partial: false, resetPagingIfModifying: true },
      ),
    );
  }, [entityId]);

  return (
    <>
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
          <Row key={edge.cursor} gap={2}>
            <Tag>{shortType}</Tag>
            <Tag>{entityInfo ? String(entityInfo.version) : '–'}</Tag>
            <Row.Item flexGrow={1}>
              <DateDisplay date={event.createdAt} />
            </Row.Item>
          </Row>
        );
      })}
      <Row>
        <ChangelogConnectionButtons {...{ changelogState, dispatchChangelogState }} />
      </Row>
    </>
  );
}
