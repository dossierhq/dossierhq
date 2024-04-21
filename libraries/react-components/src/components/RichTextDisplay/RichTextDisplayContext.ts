import type { PublishedRichTextFieldSpecification } from '@dossierhq/core';
import { createContext } from 'react';

interface RichTextDisplayContextValue {
  fieldSpec: PublishedRichTextFieldSpecification;
}

export const RichTextDisplayContext = createContext<RichTextDisplayContextValue>({
  defaultRichTextDisplayValue: true,
} as unknown as RichTextDisplayContextValue);
