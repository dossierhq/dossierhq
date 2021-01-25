import type { Schema } from '@datadata/core';
import { createContext } from 'react';

export interface DataDataContextValue {
  schema: Schema;
}

export const DataDataContext = createContext<DataDataContextValue | null>(null);
DataDataContext.displayName = 'DataDataContext';
