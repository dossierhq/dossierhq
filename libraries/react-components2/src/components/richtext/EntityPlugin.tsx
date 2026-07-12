import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import { $createEntityNode, INSERT_ENTITY_COMMAND } from './EntityNode.js';

export function EntityPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_ENTITY_COMMAND,
      (payload) => {
        const entityNode = $createEntityNode(payload);
        $insertNodeToNearestRoot(entityNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
