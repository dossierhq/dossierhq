import type { FunctionComponent } from 'react';
import React from 'react';
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
  return scrollable ? <div className="is-scrollable-row">{container}</div> : container;
};
FullscreenContainer.Row.displayName = 'FullscreenContainer.Row';
