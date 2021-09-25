import { useEffect, useRef } from 'react';

export function useDebugLogChangedValues(logPrefix: string, values: Record<string, unknown>): void {
  const previous = useRef({ ...values });
  useEffect(() => {
    const changedValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(values)) {
      if (previous.current[key] !== value) {
        changedValues[key] = [previous.current[key], value];
      }
    }
    if (Object.keys(changedValues).length > 0) {
      console.log(logPrefix, changedValues);
    }
    previous.current = { ...values };
  });
}
