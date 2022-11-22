import type { RichTextFieldSpecification } from '@jonasb/datadata-core';
import { createContext } from 'react';

interface RichTextDisplayContextValue {
  fieldSpec: RichTextFieldSpecification;
}

export const RichTextDisplayContext = createContext<RichTextDisplayContextValue>({
  defaultRichTextDisplayValue: true,
} as unknown as RichTextDisplayContextValue);
