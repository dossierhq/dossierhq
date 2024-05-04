import { useWindowEventListener } from '@dossierhq/design';
import { useCallback } from 'react';

export function useBeforeUnload(message: string | null) {
  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (message) {
        event.returnValue = message;
      }
    },
    [message],
  );

  useWindowEventListener('beforeunload', handleBeforeUnload);
}
