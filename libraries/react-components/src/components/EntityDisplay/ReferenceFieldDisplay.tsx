import type {
  EntityReference,
  PublishedReferenceFieldSpecification,
  PublishedRichTextFieldSpecification,
} from '@dossierhq/core';
import { Column, Text } from '@dossierhq/design';
import { useCallback, useContext, type MouseEvent } from 'react';
import { EntityDisplayDispatchContext } from '../../contexts/EntityDisplayDispatchContext.js';
import { PublishedDossierContext } from '../../contexts/PublishedDossierContext.js';
import { usePublishedEntity } from '../../hooks/usePublishedEntity.js';
import { EntityDisplayActions } from '../../reducers/EntityDisplayReducer/EntityDisplayReducer.js';
import type { FieldDisplayProps } from './FieldDisplay.js';

interface Props
  extends FieldDisplayProps<
    PublishedReferenceFieldSpecification | PublishedRichTextFieldSpecification,
    EntityReference
  > {
  className?: string;
}

export function ReferenceFieldDisplay({ className, value }: Props) {
  const { publishedClient } = useContext(PublishedDossierContext);
  const dispatchEntityDisplayState = useContext(EntityDisplayDispatchContext);
  const { entity, entityError: _error } = usePublishedEntity(publishedClient, value ?? undefined);

  const handleEntityClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      if (!value) return;
      // open entity asynchronously to not fight with the "click to activate entity" functionality
      setTimeout(() => dispatchEntityDisplayState(new EntityDisplayActions.AddEntity(value.id)));
    },
    [dispatchEntityDisplayState, value],
  );

  return entity ? (
    <Column className={className}>
      <Text textStyle="body2" marginBottom={0}>
        {entity.info.type}
      </Text>
      <Text textStyle="body1">
        <a onClick={handleEntityClick}>{entity.info.name}</a>
      </Text>
    </Column>
  ) : null;
}
