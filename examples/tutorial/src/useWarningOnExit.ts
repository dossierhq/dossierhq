import { useWindowEventListener } from '@dossierhq/design';
import { useCallback } from 'react';
import { unstable_usePrompt as usePrompt } from 'react-router-dom';

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
  usePrompt({ message, when });
}
