import type { AdminClient, EntityReference, PublishingEvent } from '@jonasb/datadata-core';
import { assertIsDefined } from '@jonasb/datadata-core';
import { InstantDisplay, Row, Tag, Text } from '@jonasb/datadata-design';
import { Temporal } from '@js-temporal/polyfill';
import React, { Fragment, useContext } from 'react';
import { StatusTag } from '../../components/StatusTag/StatusTag';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { useAdminEntityHistory } from '../../hooks/useAdminEntityHistory';
import { useAdminPublishingHistory } from '../../hooks/useAdminPublishingHistory';
import type { EntityEditorState } from '../../reducers/EntityEditorReducer/EntityEditorReducer';

interface Props {
  entityEditorState: EntityEditorState;
}

export function EntityEditorDraftSidebar({ entityEditorState }: Props) {
  const { adminClient } = useContext(AdminDataDataContext);
  const { activeEntityId } = entityEditorState;

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
          <ActivityList adminClient={adminClient} reference={{ id: activeEntityId }} />
        </>
      ) : null}
    </>
  );
}

interface ActivityListEvent {
  instant: Temporal.Instant;
  version: number | null;
  kind: PublishingEvent['kind'] | 'create';
}

function ActivityList({
  adminClient,
  reference,
}: {
  adminClient: AdminClient;
  reference: EntityReference;
}) {
  const { entityHistory, entityHistoryError: _1 } = useAdminEntityHistory(adminClient, reference);
  const { publishingHistory, publishingHistoryError: _2 } = useAdminPublishingHistory(
    adminClient,
    reference
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
          <Text textStyle="body1">v{event.version ?? '—'}</Text>
          <Row.Item flexGrow={1}>
            <InstantDisplay instant={event.instant} />
          </Row.Item>
          <Tag>{event.kind}</Tag>
        </Row>
      ))}
    </>
  );
}
