import type {
  AdminEntityHistory,
  AdminEntityVersionInfo,
  ErrorResult,
  ErrorType,
} from '@datadata/core';
import React, { useContext, useState } from 'react';
import type { DataDataContextValue } from '../..';
import {
  Button,
  Column,
  ColumnItem,
  DataDataContext,
  EntityEditorStateContext,
  Loader,
  Message,
  Row,
  Tag,
} from '../..';
import { joinClassNames } from '../../utils/ClassNameUtils';
import type { EntityEditorDraftState } from '../EntityEditor/EntityEditorReducer';

export interface EntityMetadataProps {
  entityId: string;
  className?: string;
}

export function EntityMetadata({ entityId, className }: EntityMetadataProps): JSX.Element {
  const { drafts } = useContext(EntityEditorStateContext);
  const draftState = drafts.find((x) => x.id === entityId);
  if (!draftState) {
    throw new Error(`Can't find state for id (${entityId})`);
  }

  const [selectedHistory, setSelectedHistory] = useState<'entity' | 'publish'>('entity');

  const { publishEntity, useEntityHistory } = useContext(DataDataContext);
  const { entityHistory, entityHistoryError } = useEntityHistory(
    draftState.exists ? entityId : undefined
  );
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  const { entity } = draftState;

  const selectedVersion = entityHistory?.versions.find((x) => x.version === selectedVersionId);

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
          <EntityHistory
            {...{
              draftState,
              entityHistory,
              entityHistoryError,
              selectedVersionId,
              setSelectedVersionId,
            }}
          />
        ) : null}
        {selectedHistory === 'publish' ? <PublishHistory draftState={draftState} /> : null}
      </ColumnItem>
      <PublishButton
        className="mx-2"
        entityId={entityId}
        version={selectedVersion}
        publishEntity={publishEntity}
      />
      {entityHistoryError ? (
        <Message
          kind="danger"
          message={`${entityHistoryError.error}: ${entityHistoryError.message}`}
        />
      ) : null}
    </Column>
  );
}

function EntityHistory({
  draftState,
  entityHistory,
  entityHistoryError,
  selectedVersionId,
  setSelectedVersionId,
}: {
  draftState: EntityEditorDraftState;
  entityHistory: AdminEntityHistory | undefined;
  entityHistoryError: ErrorResult<unknown, ErrorType.NotFound | ErrorType.Generic> | undefined;
  selectedVersionId: number | null;
  setSelectedVersionId: React.Dispatch<React.SetStateAction<number | null>>;
}) {
  return (
    <>
      {entityHistory ? (
        entityHistory.versions.map((version) => {
          return (
            <Button
              key={version.version}
              onClick={() => setSelectedVersionId(version.version)}
              selected={version.version === selectedVersionId}
              rounded={false}
            >
              <p className="dd text-subtitle2">
                Version {version.version}
                {version.deleted ? <Tag kind="danger" text="Deleted" /> : null}
                {version.published ? <Tag kind="primary" text="Published" /> : null}
              </p>
              <p className="dd text-body1">{version.createdAt.toLocaleString()}</p>
              <p className="dd text-body1">{version.createdBy}</p>
            </Button>
          );
        })
      ) : !entityHistoryError && draftState.exists ? (
        <Loader />
      ) : null}
    </>
  );
}

function PublishButton({
  className,
  entityId,
  version,
  publishEntity,
}: {
  className: string;
  entityId: string;
  version: AdminEntityVersionInfo | undefined;
  publishEntity: DataDataContextValue['publishEntity'];
}) {
  const disabled = !version || version.published;

  return (
    <Button
      className={className}
      kind="primary"
      disabled={disabled}
      onClick={async () => {
        const publishVersion = version?.version;
        if (typeof publishVersion === 'number') {
          const result = await publishEntity(entityId, publishVersion);
          //TODO handle error and loading
        }
      }}
    >
      {version ? `Publish v ${version.version}` : 'Publish'}
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
          <Column key={index}>
            <p className="dd text-subtitle2">Version {event.version}</p>
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
