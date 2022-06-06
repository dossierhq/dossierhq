import type { EntityReference } from '@jonasb/datadata-core';
import { FullscreenContainer, Text } from '@jonasb/datadata-design';
import React, { useContext, useEffect } from 'react';
import { EntityDisplay } from '../../components/EntityDisplay/EntityDisplay.js';
import { PublishedDataDataContext, usePublishedEntity } from '../../published';

export interface PublishedEntityDetailScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  reference: EntityReference;
  onTitleChange?: (title: string) => void;
}

export function PublishedEntityDetailScreen({
  header,
  footer,
  reference,
  onTitleChange,
}: PublishedEntityDetailScreenProps): JSX.Element | null {
  const { publishedClient, schema } = useContext(PublishedDataDataContext);
  const { entity, entityError: _2 } = usePublishedEntity(publishedClient, reference);

  useEffect(() => {
    if (entity && onTitleChange) onTitleChange(entity.info.name);
  }, [entity, onTitleChange]);

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Row flexDirection="row">
        {entity ? (
          <Text as="h1" textStyle="headline4">
            {entity.info.name}{' '}
            <Text as="span" textStyle="headline6">
              {entity.info.type}
            </Text>
          </Text>
        ) : null}
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row paddingVertical={2}>
          {schema && entity ? <EntityDisplay schema={schema} entity={entity} /> : null}
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}
