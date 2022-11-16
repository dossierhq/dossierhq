import type { EntityReference, PublishedFieldSpecification, RichText } from '@jonasb/datadata-core';
import { ClassName, toClassName } from '@jonasb/datadata-design';
import { LexicalComposer } from '@lexical/react/LexicalComposer.js';
import { ContentEditable } from '@lexical/react/LexicalContentEditable.js';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary.js';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin.js';
import type { LexicalEditor } from 'lexical/LexicalEditor.js';
import { useCallback, useContext } from 'react';
import { EntityDisplayDispatchContext } from '../../contexts/EntityDisplayDispatchContext.js';
import { EntityDisplayActions } from '../../reducers/EntityDisplayReducer/EntityDisplayReducer.js';
import { LexicalTheme } from '../../utils/LexicalTheme.js';
import { PublishedClickableLinkPlugin } from './PublishedClickableLinkPlugin.js';
import { PublishedEntityLinkNode } from './PublishedEntityLinkNode.js';
import { PublishedEntityNode } from './PublishedEntityNode.js';
import { PublishedValueItemNode } from './PublishedValueItemNode.js';
import { RichTextDisplayContext } from './RichTextDisplayContext.js';

interface Props {
  fieldSpec: PublishedFieldSpecification;
  value: RichText | null;
}

export function RichTextDisplay({ fieldSpec, value }: Props) {
  const dispatchEntityDisplayState = useContext(EntityDisplayDispatchContext);
  const handleEntityLinkClick = useCallback(
    (reference: EntityReference) => {
      // open entity asynchronously to not fight with the "click to activate entity" functionality
      setTimeout(() =>
        dispatchEntityDisplayState(new EntityDisplayActions.AddEntity(reference.id))
      );
    },
    [dispatchEntityDisplayState]
  );

  const initialConfig: Parameters<typeof LexicalComposer>[0]['initialConfig'] = {
    namespace: 'datadata',
    onError: handleError,
    nodes: [PublishedEntityNode, PublishedEntityLinkNode, PublishedValueItemNode],
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
    <RichTextDisplayContext.Provider value={{ fieldSpec }}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className={toClassName(ClassName['rich-text'], ClassName['rich-text-editor'])}
            />
          }
          placeholder=""
          ErrorBoundary={LexicalErrorBoundary}
        />
        <PublishedClickableLinkPlugin onClick={handleEntityLinkClick} />
      </LexicalComposer>
    </RichTextDisplayContext.Provider>
  );
}

function handleError(error: Error) {
  console.error(error);
}
