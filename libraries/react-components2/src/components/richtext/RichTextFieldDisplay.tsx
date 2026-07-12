import type { RichText, RichTextFieldSpecification } from '@dossierhq/core';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer.js';
import { ContentEditable } from '@lexical/react/LexicalContentEditable.js';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary.js';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin.js';
import { HeadingNode } from '@lexical/rich-text';
import type { LexicalEditor } from 'lexical';
import { ComponentNode } from './ComponentNode.js';
import { EntityLinkNode } from './EntityLinkNode.js';
import { EntityNode } from './EntityNode.js';
import { CONTENT_EDITABLE_CLASS_NAME, LexicalTheme } from './theme.js';

interface Props {
  id?: string;
  fieldSpec: RichTextFieldSpecification;
  value: RichText | null;
}

export function RichTextFieldDisplay({ id, value }: Props) {
  const initialConfig: Parameters<typeof LexicalComposer>[0]['initialConfig'] = {
    namespace: 'dossierhq',
    onError: handleError,
    nodes: [
      EntityLinkNode,
      EntityNode,
      ComponentNode,
      CodeNode,
      CodeHighlightNode,
      HeadingNode,
      LinkNode,
      ListItemNode,
      ListNode,
    ],
    editable: false,
    theme: LexicalTheme,
    editorState: value
      ? (editor: LexicalEditor) => {
          const state = editor.parseEditorState(value);
          editor.setEditorState(state);
        }
      : undefined,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable id={id} className={CONTENT_EDITABLE_CLASS_NAME} />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
    </LexicalComposer>
  );
}

function handleError(error: Error) {
  console.error(error);
}
