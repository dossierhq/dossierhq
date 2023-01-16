import type { RichTextFieldSpecification } from '@dossierhq/core';
import { createContext } from 'react';

interface RichTextDisplayContextValue {
  fieldSpec: RichTextFieldSpecification;
}

export const RichTextDisplayContext = createContext<RichTextDisplayContextValue>({
  defaultRichTextDisplayValue: true,
} as unknown as RichTextDisplayContextValue);
