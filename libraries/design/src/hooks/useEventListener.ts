import { useEffect, useRef } from 'react';

export function useEventListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void {
  const listenerRef = useRef<typeof listener | null>(null);
  listenerRef.current = listener;

  useEffect(() => {
    const actualListener = (event: Event) => {
      if (typeof listenerRef.current === 'object') {
        listenerRef.current?.handleEvent(event);
      } else {
        listenerRef.current?.(event);
      }
    };

    target.addEventListener(type, actualListener, options);
    return () => {
      target.removeEventListener(type, actualListener);
    };
  }, [target, type, options]);
}
