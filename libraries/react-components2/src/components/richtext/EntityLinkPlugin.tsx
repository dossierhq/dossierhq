import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { useEffect } from 'react';
import { EntityLinkNode, TOGGLE_ENTITY_LINK_COMMAND, toggleEntityLink } from './EntityLinkNode.js';

export function EntityLinkPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([EntityLinkNode])) {
      throw new Error(
        'EntityLinkPlugin: EntityLinkNode not registered on editor (initialConfig.nodes)',
      );
    }

    return editor.registerCommand(
      TOGGLE_ENTITY_LINK_COMMAND,
      (payload) => {
        toggleEntityLink(payload);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
