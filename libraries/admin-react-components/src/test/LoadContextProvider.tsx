import type { ErrorType, PromiseResult } from '@jonasb/datadata-core';
import React, { useEffect, useState } from 'react';
import type { DataDataContextValue } from '..';
import { DataDataContext } from '..';
import { createContextValue2 } from './TestContextAdapter';

export function LoadContextProvider({
  contextValue,
  children,
}: {
  contextValue?: () => PromiseResult<DataDataContextValue, ErrorType>;
  children: React.ReactNode;
}): JSX.Element | null {
  const [isError, setError] = useState(false);
  const [context, setContext] = useState<DataDataContextValue | null>(null);
  useEffect(() => {
    (async () => {
      const result = await (contextValue ? contextValue() : createContextValue2());
      if (result.isError()) {
        setError(true);
        return;
      }
      setContext(result.value);
    })();
  }, [contextValue]);

  if (isError) {
    return <h1>Failed initializing</h1>;
  }
  if (!context) return null;
  return <DataDataContext.Provider value={context}>{children}</DataDataContext.Provider>;
}
