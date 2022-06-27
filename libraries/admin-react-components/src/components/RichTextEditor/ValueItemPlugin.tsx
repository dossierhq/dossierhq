import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical';
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
      (_payload) => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          return false;
        }

        const focusNode = selection.focus.getNode();

        if (focusNode !== null) {
          const valueItemNode = $createAdminValueItemNode(null);
          selection.insertParagraph();
          selection.focus.getNode().getTopLevelElementOrThrow().insertBefore(valueItemNode);
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
