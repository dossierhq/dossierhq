import { useEventListener } from './useEventListener.js';

export function useDocumentEventListener<K extends keyof DocumentEventMap>(
  type: K,
  listener: (ev: DocumentEventMap[K]) => void | EventListenerObject,
  options?: boolean | AddEventListenerOptions,
): void {
  if (typeof document !== 'undefined') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEventListener(document, type, listener as EventListenerOrEventListenerObject, options);
  }
}
