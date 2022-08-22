import type { AdminFieldSpecification, RichText } from '@jonasb/datadata-core';
import { ClassName, toClassName } from '@jonasb/datadata-design';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import type { EditorState, LexicalEditor } from 'lexical';
import debounce from 'lodash/debounce';
import { useEffect, useMemo } from 'react';
import { LexicalTheme } from '../../utils/LexicalTheme.js';
import { AdminEntityNode } from './AdminEntityNode.js';
import { AdminValueItemNode } from './AdminValueItemNode.js';
import { EntityPlugin } from './EntityPlugin.js';
import { ToolbarPlugin } from './ToolbarPlugin';
import { ValueItemPlugin } from './ValueItemPlugin.js';

interface Props {
  fieldSpec: AdminFieldSpecification;
  value: RichText | null;
  onChange: (value: RichText | null) => void;
}

export function RichTextEditor({ fieldSpec, value, onChange }: Props) {
  const debouncedHandleChange = useMemo(
    () =>
      debounce((editorState: EditorState) => {
        const json = editorState.toJSON();
        onChange(json);
      }, 500),
    [onChange]
  );
  useEffect(() => {
    return () => debouncedHandleChange.cancel();
  }, [debouncedHandleChange]);

  const initialConfig = {
    namespace: 'datadata',
    onError: handleError,
    nodes: [AdminEntityNode, AdminValueItemNode],
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
      <ToolbarPlugin fieldSpec={fieldSpec} />
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className={toClassName(ClassName['rich-text'], ClassName['rich-text-editor'])}
          />
        }
        placeholder=""
      />
      <EntityPlugin />
      <ValueItemPlugin />
      <OnChangePlugin onChange={debouncedHandleChange} />
    </LexicalComposer>
  );
}

function handleError(error: Error) {
  console.error(error);
}
