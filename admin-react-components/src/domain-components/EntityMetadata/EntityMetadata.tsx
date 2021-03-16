import type { AdminEntityVersionInfo } from '@datadata/core';
import React, { useContext, useState } from 'react';
import type { DataDataContextValue } from '../..';
import { Button, DataDataContext, Loader, Message, Tag } from '../..';

export interface EntityMetadataProps {
  entityId: string;
}

interface EntityMetadataInnerProps extends EntityMetadataProps {
  publishEntity: DataDataContextValue['publishEntity'];
  useEntityHistory: DataDataContextValue['useEntityHistory'];
}

export function EntityMetadata({ entityId }: EntityMetadataProps): JSX.Element {
  const context = useContext(DataDataContext);

  if (!context) {
    return <Loader />;
  }

  const { publishEntity, useEntityHistory } = context;

  return <EntityMetadataInner {...{ entityId, publishEntity, useEntityHistory }} />;
}

function EntityMetadataInner({
  entityId,
  publishEntity,
  useEntityHistory,
}: EntityMetadataInnerProps) {
  const { entityHistory, entityHistoryError } = useEntityHistory(entityId);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  if (!entityHistory && !entityHistoryError) {
    return <Loader />;
  }

  const selectedVersion = entityHistory?.versions.find((x) => x.version === selectedVersionId);

  return (
    <div className="dd has-shadow has-background">
      {entityHistory ? (
        <>
          <p className="dd text-subtitle2">Name</p>
          <p className="dd text-body1">{entityHistory.name}</p>
          <p className="dd text-subtitle2">Type</p>
          <p className="dd text-body1">{entityHistory.type}</p>
          <p className="dd text-subtitle2">ID</p>
          <p className="dd text-body1">{entityHistory.id}</p>
          {entityHistory.versions.map((version) => {
            return (
              <div
                key={version.version}
                className="dd has-shadow"
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
          })}
        </>
      ) : null}
      <PublishButton entityId={entityId} version={selectedVersion} publishEntity={publishEntity} />
      {entityHistoryError ? (
        <Message
          kind="danger"
          message={`${entityHistoryError.error}: ${entityHistoryError.message}`}
        />
      ) : null}
    </div>
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
          console.log('XXX publishEntity result', result);
        }
      }}
    >
      {version ? `Publish v ${version.version}` : 'Publish'}
    </Button>
  );
}
