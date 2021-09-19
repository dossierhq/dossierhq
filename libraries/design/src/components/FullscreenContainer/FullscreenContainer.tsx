import type { FunctionComponent } from 'react';
import React from 'react';
import { Scrollable } from '..';
import { toClassName } from '../../utils/ClassNameUtils';

export interface FullscreenContainerProps {
  children: React.ReactNode;
}

export interface FullscreenContainerRowProps {
  center?: boolean;
  scrollable?: boolean;
  children: React.ReactNode;
}

interface FullscreenContainerComponent extends FunctionComponent<FullscreenContainerProps> {
  Row: FunctionComponent<FullscreenContainerRowProps>;
}

export const FullscreenContainer: FullscreenContainerComponent = ({
  children,
}: FullscreenContainerProps) => {
  return <div className="is-flex is-flex-direction-column is-height-100vh">{children}</div>;
};
FullscreenContainer.displayName = 'FullscreenContainer';

FullscreenContainer.Row = ({ center, scrollable, children }: FullscreenContainerRowProps) => {
  const className = toClassName(
    'is-flex-grow-0 container is-flex is-flex-direction-column',
    !center && 'is-width-100' // .container centers by default
  );
  const container = <div className={className}>{children}</div>;
  return scrollable ? (
    <Scrollable className="is-flex-grow-1 is-height-0">{container}</Scrollable>
  ) : (
    container
  );
};
FullscreenContainer.Row.displayName = 'FullscreenContainer.Row';
