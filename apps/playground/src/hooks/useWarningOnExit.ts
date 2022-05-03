import { useWindowEventListener } from '@jonasb/datadata-design';
import { useCallback } from 'react';
import { usePrompt } from './ReactRouterCompatHooks';

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
