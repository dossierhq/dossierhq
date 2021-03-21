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
  const { entityHistory, entityHistoryError } = useEntityHistory(entityId);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  const draftState = editorState.drafts.find((x) => x.id === entityId);
  if (!draftState) {
    throw new Error(`Can't find state for id (${entityId})`);
  }
  const { entity } = draftState;

  const selectedVersion = entityHistory?.versions.find((x) => x.version === selectedVersionId);

  return (
    <Column className={joinClassNames('has-shadow has-background p-2', className)} gap={2}>
      <ColumnItem>
        <p className="dd text-subtitle2">Name</p>
        <p className="dd text-body1">{entity?.name}</p>
      </ColumnItem>
      <ColumnItem>
        <p className="dd text-subtitle2">Type</p>
        <p className="dd text-body1">{entity?.entitySpec.name}</p>
      </ColumnItem>
      <ColumnItem>
        <p className="dd text-subtitle2">ID</p>
        <p className="dd text-body1">{entityId}</p>
      </ColumnItem>
      <ColumnItem className="overflow-y-scroll" grow>
        {entityHistory ? (
          entityHistory.versions.map((version) => {
            return (
              <div
                key={version.version}
                className="dd has-shadow p-2"
                onClick={() => setSelectedVersionId(version.version)}
              >
                <p className="dd text-subtitle2">
                  Version {version.version}
                  {version.deleted ? <Tag kind="danger" text="Deleted" /> : null}
                  {version.published ? <Tag kind="primary" text="Published" /> : null}
                  {version.version === selectedVersionId ? (
                    <Tag kind="primary" text="Selected" />
                  ) : null}
                </p>
                <p className="dd text-body1">{version.createdAt.toLocaleString()}</p>
                <p className="dd text-body1">{version.createdBy}</p>
              </div>
            );
          })
        ) : !entityHistoryError ? (
          <Loader />
        ) : null}
      </ColumnItem>
      <PublishButton entityId={entityId} version={selectedVersion} publishEntity={publishEntity} />
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
  entityId,
  version,
  publishEntity,
}: {
  entityId: string;
  version: AdminEntityVersionInfo | undefined;
  publishEntity: DataDataContextValue['publishEntity'];
}) {
  const disabled = !version || version.published;

  return (
    <Button
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
