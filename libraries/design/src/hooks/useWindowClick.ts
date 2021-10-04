import type { RefObject } from 'react';
import { useCallback } from 'react';
import { findAscendantElement } from '../utils/DOMUtils.js';
import { useWindowEventListener } from './useWindowEventListener.js';

export function useWindowClick(
  ignoreRef: RefObject<HTMLElement>,
  onClick: () => void,
  enabled?: boolean
): void {
  const listener = useCallback(
    (event: MouseEvent) => {
      if (enabled === false) {
        return;
      }
      if (event.target instanceof HTMLElement) {
        if (findAscendantElement(event.target, (it) => it === ignoreRef.current)) {
          return;
        }
      }

      onClick();
    },
    [enabled, onClick, ignoreRef]
  );
  useWindowEventListener('click', listener);
}
