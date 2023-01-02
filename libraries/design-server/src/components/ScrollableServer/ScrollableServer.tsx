import { toClassName } from '../../utils/ClassNameUtils.js';

export interface ScrollableProps {
  className?: string;
  style?: React.CSSProperties;
  // defaults to 'vertical'
  direction?: 'vertical' | 'horizontal';
  children: React.ReactNode;
}

export function Scrollable({
  className,
  direction,
  style,
  children,
}: ScrollableProps): JSX.Element {
  const isVertical = direction !== 'horizontal';

  if (!isVertical) {
    const realClassName = toClassName('is-overflow-x-auto is-scroll-behavior-smooth', className);
    return (
      <div className={realClassName} style={style}>
        {children}
      </div>
    );
  }

  const realClassName = toClassName('is-overflow-y-auto is-scroll-behavior-smooth', className);
  return (
    <div className={realClassName} style={style}>
      {children}
    </div>
  );
}
