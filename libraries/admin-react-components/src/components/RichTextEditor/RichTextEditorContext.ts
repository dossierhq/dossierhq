import type { FieldSpecification } from '@jonasb/datadata-core';
import { createContext } from 'react';

interface RichTextEditorContextValue {
  fieldSpec: FieldSpecification;
}

export const RichTextEditorContext = createContext<RichTextEditorContextValue>({
  defaultRichTextEditorValue: true,
} as unknown as RichTextEditorContextValue);
