import React, { useContext } from 'react';
import { DataDataContext, Loader, Message } from '../..';
import type { DataDataContextValue } from '../../contexts/DataDataContext';

export interface EntityMetadataProps {
  entityId: string;
}

interface EntityMetadataInnerProps extends EntityMetadataProps {
  useEntity: DataDataContextValue['useEntity'];
}

export function EntityMetadata({ entityId }: EntityMetadataProps): JSX.Element {
  const context = useContext(DataDataContext);

  if (!context) {
    return <Loader />;
  }

  const { useEntity } = context;

  return <EntityMetadataInner {...{ entityId, useEntity }} />;
}

function EntityMetadataInner({ entityId, useEntity }: EntityMetadataInnerProps) {
  const { entity, entityError } = useEntity(entityId, {});

  if (!entity && !entityError) {
    return <Loader />;
  }

  return (
    <div className="dd has-shadow has-background">
      {entity ? (
        <>
          <p className="dd text-body1">{entity.item._name}</p>
          <p className="dd text-body1">{entity.item._type}</p>
          <p className="dd text-body1">{entity.item._version}</p>
          <p className="dd text-body1">{entity.item.id}</p>
        </>
      ) : null}
      {entityError ? (
        <Message kind="danger" message={`${entityError.error}: ${entityError.message}`} />
      ) : null}
    </div>
  );
}
