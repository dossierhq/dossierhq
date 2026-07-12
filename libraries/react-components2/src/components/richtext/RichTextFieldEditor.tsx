import type { EntityReference, RichText, RichTextFieldSpecification } from '@dossierhq/core';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin.js';
import { LexicalComposer } from '@lexical/react/LexicalComposer.js';
import { ContentEditable } from '@lexical/react/LexicalContentEditable.js';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary.js';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin.js';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin.js';
import { ListPlugin } from '@lexical/react/LexicalListPlugin.js';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin.js';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin.js';
import { HeadingNode } from '@lexical/rich-text';
import type { EditorState, LexicalEditor } from 'lexical';
import debounce from 'lodash/debounce.js';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import { ContentEditorDispatchContext } from '../../contexts/ContentEditorDispatchContext.js';
import { ContentEditorActions } from '../../reducers/ContentEditorReducer.js';
import { ClickableLinkPlugin } from './ClickableLinkPlugin.js';
import { CodeHighlightPrismPlugin } from './CodeHighlightPrismPlugin.js';
import { ComponentNode } from './ComponentNode.js';
import { ComponentPlugin } from './ComponentPlugin.js';
import { EntityLinkNode } from './EntityLinkNode.js';
import { EntityLinkPlugin } from './EntityLinkPlugin.js';
import { EntityNode } from './EntityNode.js';
import { EntityPlugin } from './EntityPlugin.js';
import { RichTextEditorContext } from './RichTextEditorContext.js';
import { CONTENT_EDITABLE_CLASS_NAME, LexicalTheme } from './theme.js';
import { ToolbarPlugin } from './ToolbarPlugin.js';

interface Props {
  id?: string;
  fieldSpec: RichTextFieldSpecification;
  adminOnly: boolean;
  value: RichText | null;
  onChange: (value: RichText | null) => void;
}

export function RichTextFieldEditor({ id, fieldSpec, adminOnly, value, onChange }: Props) {
  const dispatchContentEditor = useContext(ContentEditorDispatchContext);

  const debouncedHandleChange = useMemo(
    () =>
      debounce((editorState: EditorState) => {
        const json = editorState.toJSON();
        onChange(json);
      }, 500),
    [onChange],
  );
  useEffect(() => {
    return () => debouncedHandleChange.cancel();
  }, [debouncedHandleChange]);

  const handleEntityLinkClick = useCallback(
    (reference: EntityReference) => {
      // open entity asynchronously to not fight with the "click to activate entity" functionality
      setTimeout(() =>
        dispatchContentEditor(new ContentEditorActions.AddDraft({ id: reference.id })),
      );
    },
    [dispatchContentEditor],
  );

  const editorValue = useMemo(() => ({ adminOnly }), [adminOnly]);

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
    theme: LexicalTheme,
    editorState: value
      ? (editor: LexicalEditor) => {
          const state = editor.parseEditorState(value);
          editor.setEditorState(state);
        }
      : undefined,
  };

  return (
    <RichTextEditorContext.Provider value={editorValue}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin fieldSpec={fieldSpec} />
        <RichTextPlugin
          contentEditable={<ContentEditable id={id} className={CONTENT_EDITABLE_CLASS_NAME} />}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ClickableLinkPlugin onEntityLinkClick={handleEntityLinkClick} />
        <CheckListPlugin />
        <CodeHighlightPrismPlugin />
        <EntityLinkPlugin />
        <EntityPlugin />
        <HistoryPlugin />
        <LinkPlugin />
        <ListPlugin />
        <ComponentPlugin />
        <OnChangePlugin onChange={debouncedHandleChange} />
      </LexicalComposer>
    </RichTextEditorContext.Provider>
  );
}

function handleError(error: Error) {
  console.error(error);
}
