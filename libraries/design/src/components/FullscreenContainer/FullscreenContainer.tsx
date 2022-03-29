import type { FunctionComponent } from 'react';
import React from 'react';
import { toSizeClassName } from '../../index.js';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { FlexContainerProps } from '../../utils/FlexboxUtils.js';
import { toFlexContainerClassName } from '../../utils/FlexboxUtils.js';
import type { GapProps, PaddingProps } from '../../utils/LayoutPropsUtils.js';
import { toSpacingClassName } from '../../utils/LayoutPropsUtils.js';
import { Scrollable } from '../index.js';

export interface FullscreenContainerProps {
  children: React.ReactNode;
}

export interface FullscreenContainerRowProps extends PaddingProps, GapProps, FlexContainerProps {
  center?: boolean;
  fullWidth?: boolean;
  fillHeight?: boolean;
  sticky?: boolean;
  children: React.ReactNode;
}

export interface FullscreenContainerScrollableRowProps {
  scrollToTopSignal?: unknown;
  children: React.ReactNode;
}

interface FullscreenContainerComponent extends FunctionComponent<FullscreenContainerProps> {
  Row: FunctionComponent<FullscreenContainerRowProps>;
  ScrollableRow: FunctionComponent<FullscreenContainerScrollableRowProps>;
}

export const FullscreenContainer: FullscreenContainerComponent = ({
  children,
}: FullscreenContainerProps) => {
  return (
    <div
      className={toClassName(
        'is-flex is-flex-direction-column',
        toSizeClassName({ height: '100vh' })
      )}
    >
      {children}
    </div>
  );
};
FullscreenContainer.displayName = 'FullscreenContainer';

FullscreenContainer.Row = ({
  center,
  fullWidth,
  fillHeight,
  sticky,
  children,
  ...props
}: FullscreenContainerRowProps) => {
  const width = !fullWidth && !center ? '100%' : undefined; // .container centers by default
  const height = fillHeight ? 0 : undefined;
  const addStickyFullWidthWrapper = sticky && !fullWidth;

  const className = toClassName(
    !fullWidth && 'is-flex-grow-0 container',
    fillHeight && 'is-flex-grow-1',
    sticky && !addStickyFullWidthWrapper && 'is-sticky-row',
    toSizeClassName({ width, height }),
    toFlexContainerClassName(props),
    toSpacingClassName(props)
  );

  if (addStickyFullWidthWrapper) {
    return (
      <div className="is-sticky-row">
        <div className={className}>{children}</div>
      </div>
    );
  }
  return <div className={className}>{children}</div>;
};
FullscreenContainer.Row.displayName = 'FullscreenContainer.Row';
FullscreenContainer.Row.defaultProps = { flexDirection: 'column' };

FullscreenContainer.ScrollableRow = ({
  scrollToTopSignal,
  children,
}: FullscreenContainerScrollableRowProps) => {
  return (
    <Scrollable
      className={toClassName('is-flex-grow-1', toSizeClassName({ height: 0 }))}
      scrollToTopSignal={scrollToTopSignal}
    >
      {children}
    </Scrollable>
  );
};
FullscreenContainer.ScrollableRow.displayName = 'FullscreenContainer.ScrollableRow';
