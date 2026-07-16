import { useEffect } from 'react';

/** Warns before closing/reloading the tab while `message` is set. */
export function useBeforeUnload(message: string | null): void {
  useEffect(() => {
    if (!message) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [message]);
}
