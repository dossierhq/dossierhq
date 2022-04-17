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

interface FullscreenContainerColumnsProps {
  fillHeight?: boolean;
  children: React.ReactNode;
}

interface FullscreenContainerColumnProps {
  width?: keyof typeof COLUMN_WIDTHS;
  children: React.ReactNode;
}

interface FullscreenContainerScrollableColumnProps {
  width?: keyof typeof COLUMN_WIDTHS;
  children: React.ReactNode;
}

interface FullscreenContainerComponent extends FunctionComponent<FullscreenContainerProps> {
  Row: FunctionComponent<FullscreenContainerRowProps>;
  ScrollableRow: FunctionComponent<FullscreenContainerScrollableRowProps>;
  Columns: FunctionComponent<FullscreenContainerColumnsProps>;
  Column: FunctionComponent<FullscreenContainerColumnProps>;
  ScrollableColumn: FunctionComponent<FullscreenContainerScrollableColumnProps>;
}

const COLUMN_WIDTHS = {
  '3/12': 'is-3',
};

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

FullscreenContainer.Columns = ({ fillHeight, children }: FullscreenContainerColumnsProps) => {
  return (
    <div className={toClassName('columns', fillHeight && 'is-height-0 is-flex-grow-1')}>
      {children}
    </div>
  );
};
FullscreenContainer.Columns.displayName = 'FullscreenContainer.Column';

FullscreenContainer.Column = ({ width, children }: FullscreenContainerColumnProps) => {
  return <div className={toClassName('column', width && COLUMN_WIDTHS[width])}>{children}</div>;
};
FullscreenContainer.Column.displayName = 'FullscreenContainer.Columns';

FullscreenContainer.ScrollableColumn = ({
  width,
  children,
}: FullscreenContainerScrollableColumnProps) => {
  return (
    <Scrollable className={toClassName('column', width && COLUMN_WIDTHS[width])} noShadows>
      {children}
    </Scrollable>
  );
};
FullscreenContainer.ScrollableColumn.displayName = 'FullscreenContainer.ScrollableColumn';
