import { useEventListener } from './useEventListener.js';

export function useWindowEventListener<K extends keyof WindowEventMap>(
  type: K,
  listener: (ev: WindowEventMap[K]) => void | EventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEventListener(window, type, listener as EventListenerOrEventListenerObject, options);
  }
}
