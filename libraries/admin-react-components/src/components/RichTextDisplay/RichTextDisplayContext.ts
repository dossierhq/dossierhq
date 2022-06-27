import type { FieldSpecification } from '@jonasb/datadata-core';
import { createContext } from 'react';

interface RichTextDisplayContextValue {
  fieldSpec: FieldSpecification;
}

export const RichTextDisplayContext = createContext<RichTextDisplayContextValue>({
  defaultRichTextDisplayValue: true,
} as unknown as RichTextDisplayContextValue);
