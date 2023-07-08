import { useCallback } from 'react';
import { useDocumentEventListener } from './useDocumentEventListener.js';

export function useKeyHandler(
  handleKeys: string[],
  listener: (event: KeyboardEvent) => void,
  enabled?: boolean,
): void {
  const mainListener = useCallback(
    (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      if (enabled === false) {
        return;
      }

      if (handleKeys.indexOf(event.key) >= 0) {
        event.preventDefault();
        listener(event);
      }
    },
    [handleKeys, listener, enabled],
  );

  useDocumentEventListener('keydown', mainListener);
}
