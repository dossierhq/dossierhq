import type { EntityReference } from '@jonasb/datadata-core';
import { FullscreenContainer, Text } from '@jonasb/datadata-design';
import React, { useContext, useEffect } from 'react';
import { PublishedDataDataContext, useEntity } from '../../index.js';

export interface EntityDetailScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  reference: EntityReference;
  onTitleChange?: (title: string) => void;
}

export function EntityDetailScreen({
  header,
  footer,
  reference,
  onTitleChange,
}: EntityDetailScreenProps): JSX.Element | null {
  const { publishedClient, schema: _1 } = useContext(PublishedDataDataContext);
  const { entity, entityError: _2 } = useEntity(publishedClient, reference);

  useEffect(() => {
    if (entity && onTitleChange) onTitleChange(entity.info.name);
  }, [entity, onTitleChange]);

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        <Text as="h1" textStyle="headline4">
          {entity?.info.name}
        </Text>
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row>
          <pre>{JSON.stringify(entity, null, 2)}</pre>
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}
