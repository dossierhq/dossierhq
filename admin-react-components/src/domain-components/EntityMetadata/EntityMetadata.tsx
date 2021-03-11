import React, { useContext } from 'react';
import { DataDataContext, Loader, Message } from '../..';
import type { DataDataContextValue } from '../../contexts/DataDataContext';

export interface EntityMetadataProps {
  entityId: string;
}

interface EntityMetadataInnerProps extends EntityMetadataProps {
  useEntityHistory: DataDataContextValue['useEntityHistory'];
}

export function EntityMetadata({ entityId }: EntityMetadataProps): JSX.Element {
  const context = useContext(DataDataContext);

  if (!context) {
    return <Loader />;
  }

  const { useEntityHistory } = context;

  return <EntityMetadataInner {...{ entityId, useEntityHistory }} />;
}

function EntityMetadataInner({ entityId, useEntityHistory }: EntityMetadataInnerProps) {
  const { entityHistory, entityHistoryError } = useEntityHistory(entityId);

  if (!entityHistory && !entityHistoryError) {
    return <Loader />;
  }

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
            const status = [];
            if (version.published) {
              status.push('Published');
            }
            if (version.deleted) {
              status.push('Deleted');
            }
            return (
              <div key={version.version} className="dd has-shadow">
                <p className="dd text-subtitle">Version {version.version}</p>
                <p className="dd text-body1">{version.createdAt.toLocaleString()}</p>
                <p className="dd text-body1">{version.createdBy}</p>
                {status.length > 0 ? <p className="dd text-body1">{status.join(', ')}</p> : null}
              </div>
            );
          })}
        </>
      ) : null}
      {entityHistoryError ? (
        <Message
          kind="danger"
          message={`${entityHistoryError.error}: ${entityHistoryError.message}`}
        />
      ) : null}
    </div>
  );
}
