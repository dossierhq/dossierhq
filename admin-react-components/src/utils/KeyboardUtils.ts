import { useCallback } from 'react';
import { useDocumentEventListener } from './EventUtils';

export function useKeyHandler(
  handleKeys: string[],
  listener: (event: KeyboardEvent) => void
): void {
  const mainListener = useCallback((event: KeyboardEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    if (handleKeys.indexOf(event.key) >= 0) {
      event.preventDefault();
      listener(event);
    }
  }, []);

  useDocumentEventListener('keydown', mainListener);
}
