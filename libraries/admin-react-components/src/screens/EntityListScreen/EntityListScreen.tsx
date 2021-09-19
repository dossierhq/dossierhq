import { FullscreenContainer } from '@jonasb/datadata-design';
import React from 'react';
import { TypePicker } from '../..';

export interface EntityListScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onCreateEntity: (entityType: string) => void;
}

export function EntityListScreen({
  header,
  footer,
  onCreateEntity,
}: EntityListScreenProps): JSX.Element | null {
  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Row>
        <TypePicker showEntityTypes onTypeSelected={onCreateEntity} text="Create" />
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row>List</FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}
