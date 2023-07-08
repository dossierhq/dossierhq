import type { FunctionComponent, MouseEventHandler, ReactNode } from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import type { FlexContainerProps, FlexItemProps } from '../../utils/FlexboxUtils.js';
import { toFlexContainerClassName, toFlexItemClassName } from '../../utils/FlexboxUtils.js';
import type {
  GapProps,
  MarginProps,
  PaddingProps,
  SizeProps,
} from '../../utils/LayoutPropsUtils.js';
import {
  extractLayoutProps,
  toSizeClassName,
  toSpacingClassName,
} from '../../utils/LayoutPropsUtils.js';
import { Scrollable } from '../Scrollable/Scrollable.js';

export interface FullscreenContainerProps {
  card?: boolean;
  height?: SizeProps['height'];
  children: React.ReactNode;
}

export interface FullscreenContainerRowProps
  extends MarginProps,
    PaddingProps,
    GapProps,
    FlexContainerProps,
    Pick<SizeProps, 'height'> {
  id?: string;
  center?: boolean;
  fullWidth?: boolean;
  fillHeight?: boolean;
  sticky?: boolean;
  style?: React.CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
  children: React.ReactNode;
}

export interface FullscreenContainerScrollableRowProps {
  // defaults to 'vertical'
  direction?: 'vertical' | 'horizontal';
  scrollToTopSignal?: unknown;
  shadows?: 'both' | 'bottom' | 'top' | 'none';
  children: React.ReactNode;
}

interface FullscreenContainerColumnsProps {
  fillHeight?: boolean;
  children: React.ReactNode;
}

interface FullscreenContainerColumnProps extends PaddingProps, GapProps, FlexContainerProps {
  width?: keyof typeof COLUMN_WIDTHS;
  children?: React.ReactNode;
}

interface FullscreenContainerScrollableColumnProps
  extends PaddingProps,
    GapProps,
    FlexContainerProps {
  width?: keyof typeof COLUMN_WIDTHS;
  scrollToId?: string;
  scrollToIdSignal?: unknown;
  children: React.ReactNode;
}

interface FullscreenContainerItemProps extends FlexItemProps, MarginProps, PaddingProps {
  children?: ReactNode;
}

interface FullscreenContainerComponent extends FunctionComponent<FullscreenContainerProps> {
  Row: FunctionComponent<FullscreenContainerRowProps>;
  ScrollableRow: FunctionComponent<FullscreenContainerScrollableRowProps>;
  Columns: FunctionComponent<FullscreenContainerColumnsProps>;
  Column: FunctionComponent<FullscreenContainerColumnProps>;
  ScrollableColumn: FunctionComponent<FullscreenContainerScrollableColumnProps>;
  Item: FunctionComponent<FullscreenContainerItemProps>;
}

const COLUMN_WIDTHS = {
  '1/12': 'is-1',
  '2/12': 'is-2',
  '3/12': 'is-3',
  '4/12': 'is-4',
};

export const FullscreenContainer: FullscreenContainerComponent = ({
  card,
  height,
  children,
}: FullscreenContainerProps) => {
  return (
    <div
      className={toClassName(
        'is-flex is-flex-direction-column',
        toSizeClassName({ height: height ?? '100vh' }),
        card && 'is-card-container',
      )}
    >
      {children}
    </div>
  );
};
FullscreenContainer.displayName = 'FullscreenContainer';

FullscreenContainer.Row = ({
  id,
  center,
  fullWidth,
  fillHeight,
  sticky,
  style,
  flexDirection = 'column',
  children,
  ...props
}: FullscreenContainerRowProps) => {
  const width = !fullWidth && !center ? '100%' : undefined; // .container centers by default
  const height = fillHeight ? 0 : props.height;
  const addStickyFullWidthWrapper = sticky && !fullWidth;
  const { layoutProps, otherProps } = extractLayoutProps({ ...props, flexDirection });

  const className = toClassName(
    !fullWidth && 'is-flex-grow-0 container',
    fillHeight && 'is-flex-grow-1',
    sticky && !addStickyFullWidthWrapper && 'is-sticky-row',
    toSizeClassName({ width, height }),
    toFlexContainerClassName(layoutProps),
    toSpacingClassName(layoutProps),
  );

  if (addStickyFullWidthWrapper) {
    return (
      <div id={id} className="is-sticky-row" {...otherProps}>
        <div className={className} style={style}>
          {children}
        </div>
      </div>
    );
  }
  return (
    <div id={id} className={className} style={style} {...otherProps}>
      {children}
    </div>
  );
};
FullscreenContainer.Row.displayName = 'FullscreenContainer.Row';

FullscreenContainer.ScrollableRow = ({
  direction,
  scrollToTopSignal,
  shadows,
  children,
}: FullscreenContainerScrollableRowProps) => {
  return (
    <Scrollable
      className={
        direction !== 'horizontal'
          ? toClassName('is-flex-grow-1', toSizeClassName({ height: 0 }))
          : undefined
      }
      direction={direction}
      shadows={shadows}
      scrollToTopSignal={scrollToTopSignal}
    >
      {children}
    </Scrollable>
  );
};
FullscreenContainer.ScrollableRow.displayName = 'FullscreenContainer.ScrollableRow';

FullscreenContainer.Columns = ({ fillHeight, children }: FullscreenContainerColumnsProps) => {
  return (
    <div className={toClassName('columns m-0', fillHeight && 'is-height-0 is-flex-grow-1')}>
      {children}
    </div>
  );
};
FullscreenContainer.Columns.displayName = 'FullscreenContainer.Column';

FullscreenContainer.Column = ({
  width,
  flexDirection = 'column',
  children,
  ...props
}: FullscreenContainerColumnProps) => {
  const className = toClassName(
    'column',
    width && COLUMN_WIDTHS[width],
    toFlexContainerClassName({ ...props, flexDirection }),
    toSpacingClassName(props),
  );
  return <div className={className}>{children}</div>;
};
FullscreenContainer.Column.displayName = 'FullscreenContainer.Columns';

FullscreenContainer.ScrollableColumn = ({
  scrollToId,
  scrollToIdSignal,
  width,
  flexDirection = 'column',
  children,
  ...props
}: FullscreenContainerScrollableColumnProps) => {
  const className = toClassName(
    'column p-0',
    width && COLUMN_WIDTHS[width],
    toFlexContainerClassName({ ...props, flexDirection }),
    toSpacingClassName(props),
  );
  return (
    <Scrollable
      className={className}
      shadows="none"
      scrollToId={scrollToId}
      scrollToIdSignal={scrollToIdSignal}
    >
      {children}
    </Scrollable>
  );
};
FullscreenContainer.ScrollableColumn.displayName = 'FullscreenContainer.ScrollableColumn';

FullscreenContainer.Item = ({ children, ...props }: FullscreenContainerItemProps) => (
  <div className={toClassName(toFlexItemClassName(props), toSpacingClassName(props))}>
    {children}
  </div>
);
FullscreenContainer.Item.displayName = 'FullscreenContainer.Item';
