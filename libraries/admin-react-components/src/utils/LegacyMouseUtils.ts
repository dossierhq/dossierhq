import { findAscendantHTMLElement, useWindowEventListener } from '@jonasb/datadata-design';
import { useCallback } from 'react';

export function useLegacyWindowClick(
  ignoreId: string,
  onClick: () => void,
  enabled?: boolean
): void {
  const listener = useCallback(
    (event: MouseEvent) => {
      if (enabled === false) {
        return;
      }
      if (event.target instanceof HTMLElement) {
        if (findAscendantHTMLElement(event.target, (it) => it.getAttribute('id') === ignoreId)) {
          return;
        }
      }

      onClick();
    },
    [onClick, enabled, ignoreId]
  );
  useWindowEventListener('click', listener);
}
