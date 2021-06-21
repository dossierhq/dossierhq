import type { EntityVersionInfo, ErrorType, PromiseResult } from '@datadata/core';
import { assertIsDefined, EntityPublishState } from '@datadata/core';
import React, { useContext, useState } from 'react';
import {
  Button,
  ButtonWithDropDown,
  Column,
  ColumnItem,
  DataDataContext,
  EntityEditorStateContext,
  Loader,
  Message,
  PublishStateTag,
  Row,
  RowElement,
  Tag,
} from '../..';
import { joinClassNames } from '../../utils/ClassNameUtils';
import type { EntityEditorDraftState } from '../EntityEditor/EntityEditorReducer';

export interface EntityMetadataProps {
  entityId: string;
  className?: string;
  initialSelectedHistory?: 'entity' | 'publish';
}

export function EntityMetadata({
  entityId,
  className,
  initialSelectedHistory,
}: EntityMetadataProps): JSX.Element {
  const { drafts } = useContext(EntityEditorStateContext);
  const draftState = drafts.find((x) => x.id === entityId);
  assertIsDefined(draftState);

  const [selectedHistory, setSelectedHistory] = useState<'entity' | 'publish'>(
    initialSelectedHistory ?? 'entity'
  );
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  const { entity, publishState } = draftState;

  return (
    <Column className={joinClassNames('has-shadow has-background py-2', className)} gap={2}>
      <ColumnItem className="mx-2">
        <p className="dd text-subtitle2">Name</p>
        <p className="dd text-body1">{entity?.name}</p>
      </ColumnItem>
      <ColumnItem className="mx-2">
        <p className="dd text-subtitle2">Type</p>
        <p className="dd text-body1">{entity?.entitySpec.name}</p>
      </ColumnItem>
      <ColumnItem className="mx-2">
        <p className="dd text-subtitle2">ID</p>
        <p className="dd text-body1">{entityId}</p>
      </ColumnItem>
      <ColumnItem className="mx-2">
        <Row>
          <RowElement as="p" className="text-subtitle2" grow>
            Publish state
          </RowElement>
          {publishState ? <PublishStateTag publishState={publishState} /> : null}
        </Row>
        <NewPublishButton draftState={draftState} />
      </ColumnItem>
      <ColumnItem as={Row} gap={2}>
        <Button
          selected={selectedHistory === 'entity'}
          onClick={() => setSelectedHistory('entity')}
        >
          Entity history
        </Button>
        <Button
          selected={selectedHistory === 'publish'}
          onClick={() => setSelectedHistory('publish')}
        >
          Publish history
        </Button>
      </ColumnItem>
      <ColumnItem as={Column} grow overflowY="scroll">
        {selectedHistory === 'entity' ? (
          <EntityHistoryList
            {...{
              draftState,
              selectedVersionId,
              setSelectedVersionId,
            }}
          />
        ) : null}
        {selectedHistory === 'publish' ? <PublishHistory draftState={draftState} /> : null}
      </ColumnItem>
    </Column>
  );
}

function EntityHistoryList({
  draftState,
  selectedVersionId,
  setSelectedVersionId,
}: {
  draftState: EntityEditorDraftState;
  selectedVersionId: number | null;
  setSelectedVersionId: React.Dispatch<React.SetStateAction<number | null>>;
}) {
  const { useEntityHistory } = useContext(DataDataContext);
  const { entityHistory, entityHistoryError } = useEntityHistory(
    draftState.exists ? draftState.id : undefined
  );

  return (
    <>
      {entityHistory ? (
        entityHistory.versions.map((version) => {
          const selected = version.version === selectedVersionId;
          return (
            <Button
              key={version.version}
              onClick={() => setSelectedVersionId(version.version)}
              selected={selected}
              rounded={false}
            >
              <p className="dd text-subtitle2">
                Version {version.version}
                {version.deleted ? <Tag kind="danger" text="Deleted" /> : null}
                {version.published ? <Tag kind="primary" text="Published" /> : null}
              </p>
              <p className="dd text-body1">{version.createdAt.toLocaleString()}</p>
              <p className="dd text-body1">{version.createdBy}</p>
              {selected ? (
                <PublishButton className="mt-1" entityId={draftState.id} version={version} />
              ) : null}
            </Button>
          );
        })
      ) : !entityHistoryError && draftState.exists ? (
        <Loader />
      ) : null}
      {entityHistoryError ? (
        <Message
          kind="danger"
          message={`${entityHistoryError.error}: ${entityHistoryError.message}`}
        />
      ) : null}
    </>
  );
}

function NewPublishButton({
  draftState,
}: {
  draftState: EntityEditorDraftState;
}): JSX.Element | null {
  const { archiveEntity, publishEntities, unarchiveEntity, unpublishEntities } =
    useContext(DataDataContext);
  const [loading, setLoading] = useState(false);

  const { id, entity, publishState } = draftState;

  if (!publishState) {
    return null;
  }

  let publishActionsIds: Array<'publish' | 'unpublish' | 'archive' | 'unarchive'> = [];
  if ([EntityPublishState.Draft, EntityPublishState.Withdrawn].includes(publishState)) {
    publishActionsIds = ['publish', 'archive'];
  } else if (publishState === EntityPublishState.Published) {
    publishActionsIds = ['unpublish'];
  } else if (publishState === EntityPublishState.Modified) {
    publishActionsIds = ['publish', 'unpublish'];
  } else if (publishState === EntityPublishState.Archived) {
    publishActionsIds = ['unarchive', 'publish'];
  }

  const publishActions: { name: string; handler: () => PromiseResult<void, ErrorType> }[] =
    publishActionsIds.map((action) => {
      switch (action) {
        case 'archive':
          return {
            name: 'Archive',
            handler: () => archiveEntity(id),
          };

        case 'unarchive':
          return {
            name: 'Unarchive',
            handler: () => unarchiveEntity(id),
          };
        case 'publish': {
          assertIsDefined(entity);
          const latestVersion = entity.version - 1; //TODO make more robust
          return {
            name: 'Publish',
            handler: () => publishEntities([{ id, version: latestVersion }]),
          };
        }
        case 'unpublish':
          return { name: 'Unpublish', handler: () => unpublishEntities([id]) };
      }
    });

  const [buttonAction, ...dropdownActions] = publishActions;
  const dropDownItems = dropdownActions.map(({ name, handler }) => ({
    key: name,
    text: name,
    handler,
  }));

  const executeHandler = async (handler: typeof buttonAction['handler']) => {
    setLoading(true);
    const result = await handler();
    setLoading(false);
  };

  return (
    <ButtonWithDropDown
      id="publish-button"
      kind="primary"
      loading={loading}
      dropDownTitle="Publish actions"
      items={dropDownItems}
      onClick={() => executeHandler(buttonAction.handler)}
      onItemClick={(item) => executeHandler(item.handler)}
    >
      {buttonAction.name}
    </ButtonWithDropDown>
  );
}

function PublishButton({
  className,
  entityId,
  version,
}: {
  className?: string;
  entityId: string;
  version: EntityVersionInfo;
}) {
  const { publishEntities, unpublishEntities } = useContext(DataDataContext);
  const publish = !version.published;

  return (
    <Button
      className={className}
      kind="primary"
      onClick={async () => {
        const publishVersion = version.version;
        const result = await (publish
          ? publishEntities([{ id: entityId, version: publishVersion }])
          : unpublishEntities([entityId]));
        //TODO handle error and loading
      }}
    >
      {publish ? 'Publish' : 'Unpublish'}
    </Button>
  );
}

function PublishHistory({ draftState }: { draftState: EntityEditorDraftState }) {
  const { usePublishHistory } = useContext(DataDataContext);
  const { publishHistory, publishHistoryError } = usePublishHistory(
    draftState.exists ? draftState.id : undefined
  );

  if (!draftState.exists) {
    return null;
  }
  if (!publishHistory && !publishHistoryError) {
    return <Loader />;
  }
  return (
    <>
      {publishHistory?.events.map((event, index) => {
        return (
          <Column key={index} className="px-2 py-1">
            <p className="dd text-subtitle2">
              {`${event.kind}${event.version !== null ? ` (version ${event.version})` : ''}`}
            </p>
            <p className="dd text-body1">{event.publishedAt.toLocaleString()}</p>
            <p className="dd text-body1">{event.publishedBy}</p>
          </Column>
        );
      })}
      {publishHistoryError ? (
        <Message
          kind="danger"
          message={`${publishHistoryError.error}: ${publishHistoryError.message}`}
        />
      ) : null}
    </>
  );
}
