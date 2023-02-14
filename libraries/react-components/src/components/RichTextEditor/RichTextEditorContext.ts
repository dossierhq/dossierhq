import { createContext } from 'react';

interface RichTextEditorContextValue {
  adminOnly: boolean;
}

export const RichTextEditorContext = createContext<RichTextEditorContextValue>({
  defaultRichTextEditorContextValue: true,
} as unknown as RichTextEditorContextValue);
