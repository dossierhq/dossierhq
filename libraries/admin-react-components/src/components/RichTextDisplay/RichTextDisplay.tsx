import type { FieldSpecification, RichText } from '@jonasb/datadata-core';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import type { LexicalEditor } from 'lexical/LexicalEditor.js';
import { PublishedEntityNode } from './PublishedEntityNode.js';
import { PublishedValueItemNode } from './PublishedValueItemNode.js';
import { RichTextDisplayContext } from './RichTextDisplayContext.js';

interface Props {
  fieldSpec: FieldSpecification;
  value: RichText | null;
}

export function RichTextDisplay({ fieldSpec, value }: Props) {
  const initialConfig = {
    namespace: 'datadata',
    onError: handleError,
    nodes: [PublishedEntityNode, PublishedValueItemNode],
    readOnly: true,
    editorState: value
      ? (editor: LexicalEditor) => {
          const state = editor.parseEditorState(value);
          editor.setEditorState(state);
        }
      : undefined,
  };

  return (
    <RichTextDisplayContext.Provider value={{ fieldSpec }}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin contentEditable={<ContentEditable />} placeholder="" />
      </LexicalComposer>
    </RichTextDisplayContext.Provider>
  );
}

function handleError(error: Error) {
  console.error(error);
}
