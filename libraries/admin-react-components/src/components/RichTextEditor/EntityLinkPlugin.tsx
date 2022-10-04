import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import {
  AdminEntityLinkNode,
  toggleEntityLink,
  TOGGLE_ADMIN_ENTITY_LINK_COMMAND,
} from './AdminEntityLinkNode.js';

export function EntityLinkPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([AdminEntityLinkNode])) {
      throw new Error(
        'EntityLinkPlugin: AdminEntityLinkNode not registered on editor (initialConfig.nodes)'
      );
    }

    return editor.registerCommand(
      TOGGLE_ADMIN_ENTITY_LINK_COMMAND,
      (payload) => {
        toggleEntityLink(payload);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
