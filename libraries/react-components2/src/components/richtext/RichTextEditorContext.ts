import { createContext } from 'react';

interface RichTextEditorContextValue {
  adminOnly: boolean;
}

export const RichTextEditorContext = createContext<RichTextEditorContextValue>({
  adminOnly: false,
});
RichTextEditorContext.displayName = 'RichTextEditorContext';
