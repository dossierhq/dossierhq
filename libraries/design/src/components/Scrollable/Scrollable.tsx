import React from 'react';
import { useIsObstructedObserver } from '../../hooks/useIsObstructedObserver';
import { toClassName } from '../../utils/ClassNameUtils';

export interface ScrollableProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function Scrollable({ className, style, children }: ScrollableProps): JSX.Element {
  const realClassName = toClassName('scrollable', className);
  const stickyTopShadowRef = useIsObstructedObserver();
  const stickyBottomShadowRef = useIsObstructedObserver();
  return (
    <div className={realClassName} style={style}>
      <div ref={stickyTopShadowRef} className="sticky-top-shadow is-sticky-top" />
      {children}
      <div ref={stickyBottomShadowRef} className="sticky-bottom-shadow is-sticky-bottom" />
    </div>
  );
}
