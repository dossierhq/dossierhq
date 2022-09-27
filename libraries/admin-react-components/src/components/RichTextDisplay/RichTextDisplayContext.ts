import type { PublishedFieldSpecification } from '@jonasb/datadata-core';
import { createContext } from 'react';

interface RichTextDisplayContextValue {
  fieldSpec: PublishedFieldSpecification;
}

export const RichTextDisplayContext = createContext<RichTextDisplayContextValue>({
  defaultRichTextDisplayValue: true,
} as unknown as RichTextDisplayContextValue);
