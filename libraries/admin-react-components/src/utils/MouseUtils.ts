import { useCallback } from 'react';
import { findAscendantElement } from './DOMUtils.js';
import { useWindowEventListener } from './EventUtils.js';

export function useWindowClick(ignoreId: string, onClick: () => void, enabled?: boolean): void {
  const listener = useCallback(
    (event: MouseEvent) => {
      if (enabled === false) {
        return;
      }
      if (event.target instanceof HTMLElement) {
        if (findAscendantElement(event.target, (it) => it.getAttribute('id') === ignoreId)) {
          return;
        }
      }

      onClick();
    },
    [onClick, enabled, ignoreId]
  );
  useWindowEventListener('click', listener);
}
