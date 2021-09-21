import type { FunctionComponent } from 'react';
import React from 'react';
import { Scrollable } from '..';
import { toClassName } from '../../utils/ClassNameUtils';
import type { FlexContainerProps } from '../../utils/FlexboxUtils';
import { toFlexContainerClassName } from '../../utils/FlexboxUtils';
import type { GapProps, PaddingProps } from '../../utils/LayoutPropsUtils';
import { toSpacingClassName } from '../../utils/LayoutPropsUtils';

export interface FullscreenContainerProps {
  children: React.ReactNode;
}

export interface FullscreenContainerRowProps extends PaddingProps, GapProps, FlexContainerProps {
  center?: boolean;
  fullWidth?: boolean;
  fillHeight?: boolean;
  children: React.ReactNode;
}

export interface FullscreenContainerScrollableRowProps {
  children: React.ReactNode;
}

interface FullscreenContainerComponent extends FunctionComponent<FullscreenContainerProps> {
  Row: FunctionComponent<FullscreenContainerRowProps>;
  ScrollableRow: FunctionComponent<FullscreenContainerScrollableRowProps>;
}

export const FullscreenContainer: FullscreenContainerComponent = ({
  children,
}: FullscreenContainerProps) => {
  return <div className="is-flex is-flex-direction-column is-height-100vh">{children}</div>;
};
FullscreenContainer.displayName = 'FullscreenContainer';

FullscreenContainer.Row = ({
  center,
  fullWidth,
  fillHeight,
  children,
  ...props
}: FullscreenContainerRowProps) => {
  const className = toClassName(
    !fullWidth && 'is-flex-grow-0 container',
    !fullWidth && !center && 'is-width-100', // .container centers by default
    fillHeight && 'is-flex-grow-1 is-height-0',
    toFlexContainerClassName(props),
    toSpacingClassName(props)
  );
  return <div className={className}>{children}</div>;
};
FullscreenContainer.Row.displayName = 'FullscreenContainer.Row';
FullscreenContainer.Row.defaultProps = { flexDirection: 'column' };

FullscreenContainer.ScrollableRow = ({ children }: FullscreenContainerRowProps) => {
  return <Scrollable className="is-flex-grow-1 is-height-0">{children}</Scrollable>;
};
FullscreenContainer.ScrollableRow.displayName = 'FullscreenContainer.ScrollableRow';
