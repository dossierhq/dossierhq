import type { EntityReference } from '@jonasb/datadata-core';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { LexicalEditor } from 'lexical';
import { $getNearestNodeFromDOMNode, $getSelection, $isRangeSelection } from 'lexical';
import { useEffect } from 'react';
import { $isAdminEntityLinkNode } from './AdminEntityLinkNode.js';

interface Props {
  onClick: (reference: EntityReference) => void;
}

export function AdminClickableLinkPlugin({ onClick }: Props): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const anchorDomNode = getAnchorDomNode(event, editor);
      if (!anchorDomNode) {
        return;
      }

      const selection = editor.getEditorState().read($getSelection);
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        return;
      }

      let entityReference: EntityReference | null = null;
      editor.update(() => {
        const maybeLinkNode = $getNearestNodeFromDOMNode(anchorDomNode);

        if ($isAdminEntityLinkNode(maybeLinkNode)) {
          entityReference = maybeLinkNode.getReference();
        }
      });

      if (!entityReference) {
        return;
      }

      onClick(entityReference);
    }

    return editor.registerRootListener(
      (rootElement: null | HTMLElement, prevRootElement: null | HTMLElement) => {
        if (prevRootElement) {
          prevRootElement.removeEventListener('click', handleClick);
        }

        if (rootElement) {
          rootElement.addEventListener('click', handleClick);
        }
      }
    );
  }, [editor, onClick]);
  return null;
}

function isAnchorDomNode(node: Node): node is HTMLAnchorElement {
  return node.nodeName.toLowerCase() === 'a';
}

function getAnchorDomNode(event: MouseEvent, editor: LexicalEditor): HTMLAnchorElement | null {
  return editor.getEditorState().read(() => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return null;
    }
    if (isAnchorDomNode(target)) {
      return target;
    }
    if (target.parentNode && isAnchorDomNode(target.parentNode)) {
      return target.parentNode;
    }
    return null;
  });
}
