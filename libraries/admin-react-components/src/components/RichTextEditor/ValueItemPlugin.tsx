import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import {
  $createAdminValueItemNode,
  INSERT_ADMIN_VALUE_ITEM_COMMAND,
} from './AdminValueItemNode.js';

export function ValueItemPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_ADMIN_VALUE_ITEM_COMMAND,
      (payload) => {
        const valueItemNode = $createAdminValueItemNode(payload);
        $insertNodeToNearestRoot(valueItemNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
