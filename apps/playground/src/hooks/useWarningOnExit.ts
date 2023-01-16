import { useWindowEventListener } from '@dossierhq/design';
import { useCallback } from 'react';
import { usePrompt } from './ReactRouterCompatHooks.js';

export function useWarningOnExit(message: string, when = true) {
  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (when) {
        event.returnValue = message;
      }
    },
    [when, message]
  );

  useWindowEventListener('beforeunload', handleBeforeUnload);
  usePrompt(message, when);
}
