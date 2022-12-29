import type {
  AdminClient,
  AdminEntity,
  EntityReference,
  PublishingEvent,
} from '@jonasb/datadata-core';
import { assertIsDefined } from '@jonasb/datadata-core';
import { Button, DateDisplay, Row, TabContainer, Tag, Text } from '@jonasb/datadata-design';
import { useContext, useState } from 'react';
import { StatusTag } from '../../components/StatusTag/StatusTag.js';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext.js';
import { useAdminEntityHistory } from '../../hooks/useAdminEntityHistory.js';
import { useAdminPublishingHistory } from '../../hooks/useAdminPublishingHistory.js';
import type { EntityEditorState } from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';
import { AuthKeyTag } from '../../shared/components/AuthKeyTag/AuthKeyTag.js';
import { AdminEntityLinks } from './AdminEntityLinks.js';

interface Props {
  entityEditorState: EntityEditorState;
  onShowEntityHistory: (reference: EntityReference) => void;
}

interface ActivityListEvent {
  date: Date;
  version: number | null;
  kind: PublishingEvent['kind'] | 'create';
}

const ActivityFilter = {
  All: 'All',
  Versions: 'Versions',
  Publishing: 'Publishing',
} as const;
type ActivityFilter = typeof ActivityFilter[keyof typeof ActivityFilter];

export function EntityEditorDraftSidebar({ entityEditorState, onShowEntityHistory }: Props) {
  const { adminClient, authKeys } = useContext(AdminDataDataContext);
  const { activeEntityId } = entityEditorState;

  const [activityFilter, setActivityFilter] = useState<ActivityFilter>(ActivityFilter.All);

  if (!activeEntityId) return null;
  const draftState = entityEditorState.drafts.find((it) => it.id === activeEntityId);
  assertIsDefined(draftState);

  const { draft, entity } = draftState;

  if (!draft) return null;

  return (
    <>
      <Text textStyle="headline6">{draft.name || <i>Untitled</i>}</Text>
      {entity ? (
        <>
          <Text textStyle="body2">{entity.id}</Text>
          <Row gap={2}>
            <StatusTag status={entity.info.status} />
            <AuthKeyTag authKey={entity.info.authKey} authKeys={authKeys} />
          </Row>
          <AdminEntityLinks entityReference={{ id: entity.id }} />
          {entity.info.version > 0 ? (
            <Button onClick={() => onShowEntityHistory({ id: entity.id })}>Entity history</Button>
          ) : null}
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
  adminClient: AdminClient<AdminEntity<string, object>>;
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
        date: it.createdAt,
        version: it.version,
        kind: 'create',
      }))
    );
  }
  if (publishingHistory) {
    events.push(
      ...publishingHistory.events.map<ActivityListEvent>((it) => ({
        date: it.publishedAt,
        version: it.version,
        kind: it.kind,
      }))
    );
  }

  events.sort((a, b) => {
    return b.date.getTime() - a.date.getTime(); // descending
  });

  return (
    <>
      {events.map((event, index) => (
        <Row key={index} gap={2}>
          <Tag>{event.version === null ? '–' : '' + event.version}</Tag>
          <Tag>{event.kind}</Tag>
          <Row.Item flexGrow={1}>
            <DateDisplay date={event.date} />
          </Row.Item>
        </Row>
      ))}
    </>
  );
}
