import React, { useEffect, useRef } from 'react';
import { useIsClippedObserver } from '../../hooks/useIsClippedObserver.js';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface ScrollableProps {
  className?: string;
  style?: React.CSSProperties;
  scrollToTopSignal?: unknown;
  children: React.ReactNode;
}

export function Scrollable({
  className,
  style,
  scrollToTopSignal,
  children,
}: ScrollableProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const realClassName = toClassName('scrollable', className);
  const stickyTopShadowRef = useIsClippedObserver();
  const stickyBottomShadowRef = useIsClippedObserver();

  useEffect(() => {
    if (scrollToTopSignal && ref.current) {
      ref.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [scrollToTopSignal]);

  return (
    <div ref={ref} className={realClassName} style={style}>
      <div ref={stickyTopShadowRef} className="sticky-top-shadow is-sticky-top" />
      {children}
      <div ref={stickyBottomShadowRef} className="sticky-bottom-shadow is-sticky-bottom" />
    </div>
  );
}
