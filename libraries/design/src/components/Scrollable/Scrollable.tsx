import React, { useEffect, useRef } from 'react';
import { useIsClippedObserver } from '../../hooks/useIsClippedObserver.js';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface ScrollableProps {
  className?: string;
  style?: React.CSSProperties;
  noShadows?: boolean;
  scrollToId?: string;
  scrollToIdSignal?: unknown;
  scrollToTopSignal?: unknown;
  children: React.ReactNode;
}

export function Scrollable({
  className,
  style,
  noShadows,
  scrollToId,
  scrollToIdSignal,
  scrollToTopSignal,
  children,
}: ScrollableProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const realClassName = toClassName('scrollable', className);

  useEffect(() => {
    if (scrollToTopSignal && ref.current) {
      ref.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [scrollToTopSignal]);

  useEffect(() => {
    if (scrollToId && scrollToIdSignal && ref.current) {
      const scrollToElement = document.getElementById(scrollToId);
      if (scrollToElement) {
        let top = scrollToElement.offsetTop;
        const style = getComputedStyle(scrollToElement);
        if (style.position === 'sticky') {
          const nextElement = scrollToElement.nextElementSibling;
          if (nextElement && nextElement instanceof HTMLElement) {
            top = nextElement.offsetTop - scrollToElement.scrollHeight - ref.current.offsetTop;
          }
        }
        ref.current.scrollTo({ behavior: 'smooth', top });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToIdSignal]);

  return (
    <div ref={ref} className={realClassName} style={style}>
      {noShadows !== true ? <StickyShadow className="sticky-top-shadow is-sticky-top" /> : null}
      {children}
      {noShadows !== true ? (
        <StickyShadow className="sticky-bottom-shadow is-sticky-bottom" />
      ) : null}
    </div>
  );
}

function StickyShadow({ className }: { className: string }) {
  const shadowRef = useIsClippedObserver();
  return <div className={className} ref={shadowRef} />;
}
