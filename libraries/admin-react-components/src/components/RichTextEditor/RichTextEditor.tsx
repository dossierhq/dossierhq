import type { FieldSpecification, RichText } from '@jonasb/datadata-core';
import { Button } from '@jonasb/datadata-design';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import type { LexicalEditor } from 'lexical/LexicalEditor.js';
import type { EditorState } from 'lexical/LexicalEditorState.js';
import debounce from 'lodash/debounce';
import { useEffect, useMemo } from 'react';
import { AdminEntityNode, INSERT_ADMIN_ENTITY_COMMAND } from './AdminEntityNode.js';
import { AdminValueItemNode, INSERT_ADMIN_VALUE_ITEM_COMMAND } from './AdminValueItemNode.js';
import { EntityPlugin } from './EntityPlugin.js';
import { RichTextEditorContext } from './RichTextEditorContext.js';
import { ValueItemPlugin } from './ValueItemPlugin.js';

interface Props {
  fieldSpec: FieldSpecification;
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
    editorState: value
      ? (editor: LexicalEditor) => {
          const state = editor.parseEditorState(value);
          editor.setEditorState(state);
        }
      : undefined,
  };

  return (
    <RichTextEditorContext.Provider value={{ fieldSpec }}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <RichTextPlugin contentEditable={<ContentEditable />} placeholder="" />
        <EntityPlugin />
        <ValueItemPlugin />
        <OnChangePlugin onChange={debouncedHandleChange} />
      </LexicalComposer>
    </RichTextEditorContext.Provider>
  );
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  return (
    <>
      <Button onClick={() => editor.dispatchCommand(INSERT_ADMIN_ENTITY_COMMAND, undefined)}>
        Add entity
      </Button>
      <Button onClick={() => editor.dispatchCommand(INSERT_ADMIN_VALUE_ITEM_COMMAND, undefined)}>
        Add value item
      </Button>
    </>
  );
}

function handleError(error: Error) {
  console.error(error);
}
