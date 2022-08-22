import type { AdminFieldSpecification } from '@jonasb/datadata-core';
import { createContext } from 'react';

interface RichTextDisplayContextValue {
  fieldSpec: AdminFieldSpecification;
}

export const RichTextDisplayContext = createContext<RichTextDisplayContextValue>({
  defaultRichTextDisplayValue: true,
} as unknown as RichTextDisplayContextValue);
