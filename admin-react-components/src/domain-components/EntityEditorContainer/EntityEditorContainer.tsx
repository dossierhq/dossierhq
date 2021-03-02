import React from 'react';
import { EntityEditor, EntityMetadata } from '../..';

export interface EntityEditorContainerProps {
  idPrefix?: string;
  entity: { id: string } | { type: string; isNew: true };
}

export function EntityEditorContainer({
  idPrefix,
  entity,
}: EntityEditorContainerProps): JSX.Element {
  return (
    <div style={{ display: 'flex' }}>
      <EntityEditor {...{ idPrefix, entity }} style={{ flexGrow: 1 }} />
      {'id' in entity ? <EntityMetadata entityId={entity.id} /> : null}
    </div>
  );
}
