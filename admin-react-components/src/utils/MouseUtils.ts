import { useCallback } from 'react';
import { useWindowEventListener } from './EventUtils';

export function useWindowClick(
  ignoreId: string | undefined,
  onClick: () => void,
  enabled?: boolean
): void {
  const listener = useCallback(
    (event: MouseEvent) => {
      if (enabled === false) {
        return;
      }
      if (
        event.target instanceof Element &&
        ignoreId &&
        event.target.getAttribute('id') === ignoreId
      ) {
        return;
      }
      onClick();
    },
    [onClick, enabled]
  );
  useWindowEventListener('click', listener);
}
