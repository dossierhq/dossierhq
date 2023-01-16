import type {
  EntityFieldSpecification,
  EntityReference,
  RichTextFieldSpecification,
} from '@dossierhq/core';
import { Column, Text } from '@jonasb/datadata-design';
import type { MouseEvent } from 'react';
import { useCallback, useContext } from 'react';
import { EntityDisplayDispatchContext } from '../../contexts/EntityDisplayDispatchContext.js';
import { PublishedDataDataContext } from '../../published/contexts/PublishedDataDataContext.js';
import { usePublishedEntity } from '../../published/hooks/usePublishedEntity.js';
import { EntityDisplayActions } from '../../reducers/EntityDisplayReducer/EntityDisplayReducer.js';
import type { FieldDisplayProps } from './FieldDisplay.js';

interface Props
  extends FieldDisplayProps<
    EntityFieldSpecification | RichTextFieldSpecification,
    EntityReference
  > {
  className?: string;
}

export function EntityTypeFieldDisplay({ className, value }: Props) {
  const { publishedClient } = useContext(PublishedDataDataContext);
  const dispatchEntityDisplayState = useContext(EntityDisplayDispatchContext);
  const { entity, entityError: _error } = usePublishedEntity(publishedClient, value ?? undefined);

  const handleEntityClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      if (!value) return;
      // open entity asynchronously to not fight with the "click to activate entity" functionality
      setTimeout(() => dispatchEntityDisplayState(new EntityDisplayActions.AddEntity(value.id)));
    },
    [dispatchEntityDisplayState, value]
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
