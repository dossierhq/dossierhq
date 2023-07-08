import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import { $createAdminEntityNode, INSERT_ADMIN_ENTITY_COMMAND } from './AdminEntityNode.js';

export function EntityPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_ADMIN_ENTITY_COMMAND,
      (payload) => {
        const entityNode = $createAdminEntityNode(payload);
        $insertNodeToNearestRoot(entityNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
