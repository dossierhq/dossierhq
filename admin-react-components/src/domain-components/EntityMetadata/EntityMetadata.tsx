import type { AdminEntityVersionInfo } from '@datadata/core';
import React, { useContext, useState } from 'react';
import type { DataDataContextValue, EntityEditorState } from '../..';
import { Button, Column, ColumnItem, DataDataContext, Loader, Message, Tag } from '../..';
import { joinClassNames } from '../../utils/ClassNameUtils';

export interface EntityMetadataProps {
  entityId: string;
  className?: string;
  editorState: EntityEditorState;
}

interface EntityMetadataInnerProps extends EntityMetadataProps {
  publishEntity: DataDataContextValue['publishEntity'];
  useEntityHistory: DataDataContextValue['useEntityHistory'];
}

export function EntityMetadata({
  entityId,
  className,
  editorState,
}: EntityMetadataProps): JSX.Element {
  const context = useContext(DataDataContext);

  if (!context) {
    return <Loader />;
  }

  const { publishEntity, useEntityHistory } = context;

  return (
    <EntityMetadataInner
      {...{
        entityId,
        className,
        editorState,
        publishEntity,
        useEntityHistory,
      }}
    />
  );
}

function EntityMetadataInner({
  entityId,
  className,
  editorState,
  publishEntity,
  useEntityHistory,
}: EntityMetadataInnerProps) {
  const draftState = editorState.drafts.find((x) => x.id === entityId);
  if (!draftState) {
    throw new Error(`Can't find state for id (${entityId})`);
  }

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
      <ColumnItem as={Column} grow overflowY="scroll">
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
