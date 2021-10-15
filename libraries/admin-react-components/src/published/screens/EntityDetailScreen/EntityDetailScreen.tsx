import type { EntityReference } from '@jonasb/datadata-core';
import { FullscreenContainer } from '@jonasb/datadata-design';
import React, { useContext } from 'react';
import { PublishedDataDataContext, useEntity } from '../../index.js';

export interface EntityDetailScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  reference: EntityReference;
}

export function EntityDetailScreen({
  header,
  footer,
  reference,
}: EntityDetailScreenProps): JSX.Element | null {
  const { publishedClient, schema } = useContext(PublishedDataDataContext);
  const { entity } = useEntity(publishedClient, reference);

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        {entity?.info.name}
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
