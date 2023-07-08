import type { RefObject } from 'react';
import { useCallback } from 'react';
import { findAscendantElement } from '../utils/DOMUtils.js';
import { isEventTargetNode } from '../utils/EventUtils.js';
import { useWindowEventListener } from './useWindowEventListener.js';

export function useWindowClick(
  ignoreRef: RefObject<HTMLElement>,
  onClick: () => void,
  enabled?: boolean,
): void {
  const listener = useCallback(
    (event: MouseEvent) => {
      if (enabled === false) {
        return;
      }
      const ignoreElement = ignoreRef.current;
      if (ignoreElement && isEventTargetNode(event.target)) {
        if (findAscendantElement(event.target, (it) => it === ignoreElement)) {
          return;
        }
      }

      onClick();
    },
    [enabled, onClick, ignoreRef],
  );
  useWindowEventListener('click', listener);
}
