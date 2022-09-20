import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import { toggleEntityLink, TOGGLE_ADMIN_ENTITY_LINK_COMMAND } from './AdminEntityLinkNode.js';

export function EntityLinkPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
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
