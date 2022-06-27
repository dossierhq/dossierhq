import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import { $createAdminEntityNode, INSERT_ADMIN_ENTITY_COMMAND } from './AdminEntityNode.js';

export function EntityPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_ADMIN_ENTITY_COMMAND,
      (_payload) => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return false;
        }

        const focusNode = selection.focus.getNode();

        if (focusNode !== null) {
          const entityNode = $createAdminEntityNode(null);
          selection.insertParagraph();
          selection.focus.getNode().getTopLevelElementOrThrow().insertBefore(entityNode);
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
