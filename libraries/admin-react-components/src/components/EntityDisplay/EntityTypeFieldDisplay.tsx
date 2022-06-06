import type { EntityReference } from '@jonasb/datadata-core';
import { Column, Text } from '@jonasb/datadata-design';
import type { MouseEvent } from 'react';
import React, { useCallback, useContext } from 'react';
import { PublishedDataDataContext, usePublishedEntity } from '../../published/index.js';
import type { FieldDisplayProps } from './FieldDisplay';

type Props = FieldDisplayProps<EntityReference>;

export function EntityTypeFieldDisplay({ value }: Props) {
  const { publishedClient } = useContext(PublishedDataDataContext);
  const { entity, entityError: _error } = usePublishedEntity(publishedClient, value ?? undefined);

  const handleEntityClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      if (!value) return;
      // // open entity asynchronously to not fight with the "click to activate entity" functionality
      // setTimeout(() =>
      //   dispatchEntityEditorState(new EntityEditorActions.AddDraft({ id: value.id }))
      // );
    },
    [value]
  );

  return entity ? (
    <Column>
      <Text textStyle="body2" noBottomMargin>
        {entity.info.type}
      </Text>
      <Text textStyle="body1">
        <a onClick={handleEntityClick}>{entity.info.name}</a>
      </Text>
    </Column>
  ) : null;
}
