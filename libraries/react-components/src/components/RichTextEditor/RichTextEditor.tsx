import type {
  AdminFieldSpecification,
  EntityReference,
  RichText,
  RichTextFieldSpecification,
} from '@dossierhq/core';
import { ClassName, LexicalTheme, toClassName } from '@dossierhq/design';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin.js';
import { LexicalComposer } from '@lexical/react/LexicalComposer.js';
import { ContentEditable } from '@lexical/react/LexicalContentEditable.js';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary.js';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin.js';
import { ListPlugin } from '@lexical/react/LexicalListPlugin.js';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin.js';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin.js';
import { HeadingNode } from '@lexical/rich-text';
import type { EditorState, LexicalEditor } from 'lexical';
import debounce from 'lodash/debounce.js';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import { EntityEditorDispatchContext } from '../../contexts/EntityEditorDispatchContext.js';
import { EntityEditorActions } from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';
import { AdminClickableLinkPlugin } from './AdminClickableLinkPlugin.js';
import { AdminEntityLinkNode } from './AdminEntityLinkNode.js';
import { AdminEntityNode } from './AdminEntityNode.js';
import { AdminValueItemNode } from './AdminValueItemNode.js';
import { CodeHighlightPlugin } from './CodeHighlightPlugin.js';
import { EntityLinkPlugin } from './EntityLinkPlugin.js';
import { EntityPlugin } from './EntityPlugin.js';
import { ToolbarPlugin } from './ToolbarPlugin.js';
import { ValueItemPlugin } from './ValueItemPlugin.js';

interface Props {
  fieldSpec: AdminFieldSpecification<RichTextFieldSpecification>;
  value: RichText | null;
  onChange: (value: RichText | null) => void;
}

export function RichTextEditor({ fieldSpec, value, onChange }: Props) {
  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);

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

  const handleEntityLinkClick = useCallback(
    (reference: EntityReference) => {
      // open entity asynchronously to not fight with the "click to activate entity" functionality
      setTimeout(() => dispatchEntityEditorState(new EntityEditorActions.AddDraft(reference)));
    },
    [dispatchEntityEditorState]
  );

  const initialConfig: Parameters<typeof LexicalComposer>[0]['initialConfig'] = {
    namespace: 'dossierhq',
    onError: handleError,
    nodes: [
      AdminEntityLinkNode,
      AdminEntityNode,
      AdminValueItemNode,
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
    <LexicalComposer initialConfig={initialConfig}>
      <ToolbarPlugin fieldSpec={fieldSpec} />
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            className={toClassName(ClassName['rich-text'], ClassName['rich-text-editor'])}
          />
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <AdminClickableLinkPlugin onEntityLinkClick={handleEntityLinkClick} />
      <CheckListPlugin />
      <CodeHighlightPlugin />
      <EntityLinkPlugin />
      <EntityPlugin />
      <LinkPlugin />
      <ListPlugin />
      <ValueItemPlugin />
      <OnChangePlugin onChange={debouncedHandleChange} />
    </LexicalComposer>
  );
}

function handleError(error: Error) {
  console.error(error);
}
