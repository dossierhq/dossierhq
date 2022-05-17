import type { AdminClient, EntityReference, PublishingEvent } from '@jonasb/datadata-core';
import { assertIsDefined } from '@jonasb/datadata-core';
import { InstantDisplay, Row, TabContainer, Tag, Text } from '@jonasb/datadata-design';
import { Temporal } from '@js-temporal/polyfill';
import React, { useContext, useState } from 'react';
import { StatusTag } from '../../components/StatusTag/StatusTag';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { useAdminEntityHistory } from '../../hooks/useAdminEntityHistory';
import { useAdminPublishingHistory } from '../../hooks/useAdminPublishingHistory';
import type { EntityEditorState } from '../../reducers/EntityEditorReducer/EntityEditorReducer';

interface Props {
  entityEditorState: EntityEditorState;
}

interface ActivityListEvent {
  instant: Temporal.Instant;
  version: number | null;
  kind: PublishingEvent['kind'] | 'create';
}

const ActivityFilter = {
  All: 'All',
  Versions: 'Versions',
  Publishing: 'Publishing',
} as const;
type ActivityFilter = keyof typeof ActivityFilter;

export function EntityEditorDraftSidebar({ entityEditorState }: Props) {
  const { adminClient } = useContext(AdminDataDataContext);
  const { activeEntityId } = entityEditorState;

  const [activityFilter, setActivityFilter] = useState<ActivityFilter>(ActivityFilter.All);

  if (!activeEntityId) return null;
  const draftState = entityEditorState.drafts.find((it) => it.id === activeEntityId);
  assertIsDefined(draftState);

  const { draft, entity } = draftState;

  if (!draft) return null;

  return (
    <>
      <Text textStyle="headline6">{draft.name}</Text>
      {entity ? (
        <>
          <Text textStyle="body2">{entity.id}</Text>
          <StatusTag status={entity.info.status} />
          <TabContainer small>
            {Object.keys(ActivityFilter).map((filter) => (
              <TabContainer.Item
                key={filter}
                active={filter === activityFilter}
                onClick={() => setActivityFilter(filter as ActivityFilter)}
              >
                {filter}
              </TabContainer.Item>
            ))}
          </TabContainer>
          <ActivityList
            adminClient={adminClient}
            activityFilter={activityFilter}
            reference={{ id: activeEntityId }}
          />
        </>
      ) : null}
    </>
  );
}

function ActivityList({
  adminClient,
  activityFilter,
  reference,
}: {
  adminClient: AdminClient;
  activityFilter: ActivityFilter;
  reference: EntityReference;
}) {
  const { entityHistory, entityHistoryError: _1 } = useAdminEntityHistory(
    adminClient,
    activityFilter === ActivityFilter.All || activityFilter === ActivityFilter.Versions
      ? reference
      : undefined
  );
  const { publishingHistory, publishingHistoryError: _2 } = useAdminPublishingHistory(
    adminClient,
    activityFilter === ActivityFilter.All || activityFilter === ActivityFilter.Publishing
      ? reference
      : undefined
  );

  if (!entityHistory && !publishingHistory) return null;

  const events: ActivityListEvent[] = [];

  if (entityHistory) {
    events.push(
      ...entityHistory.versions.map<ActivityListEvent>((it) => ({
        instant: it.createdAt,
        version: it.version,
        kind: 'create',
      }))
    );
  }
  if (publishingHistory) {
    events.push(
      ...publishingHistory.events.map<ActivityListEvent>((it) => ({
        instant: it.publishedAt,
        version: it.version,
        kind: it.kind,
      }))
    );
  }

  events.sort((a, b) => {
    return Temporal.Instant.compare(b.instant, a.instant); // descending
  });

  return (
    <>
      {events.map((event, index) => (
        <Row key={index} gap={2}>
          <Tag>{event.version === null ? '—' : '' + event.version}</Tag>
          <Row.Item flexGrow={1}>
            <InstantDisplay instant={event.instant} />
          </Row.Item>
          <Tag>{event.kind}</Tag>
        </Row>
      ))}
    </>
  );
}
