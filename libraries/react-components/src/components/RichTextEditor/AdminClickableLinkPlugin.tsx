import type { EntityReference } from '@dossierhq/core';
import { $isLinkNode } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import type { LexicalEditor } from 'lexical';
import { $getNearestNodeFromDOMNode, $getSelection, $isRangeSelection } from 'lexical';
import { useEffect } from 'react';
import { $isAdminEntityLinkNode } from './AdminEntityLinkNode.js';

interface Props {
  onEntityLinkClick: (reference: EntityReference) => void;
}

export function AdminClickableLinkPlugin({ onEntityLinkClick }: Props): JSX.Element | null {
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
      let url: string | null = null;
      editor.update(() => {
        const maybeLinkNode = $getNearestNodeFromDOMNode(anchorDomNode);

        if ($isLinkNode(maybeLinkNode)) {
          url = maybeLinkNode.getURL();
        } else if ($isAdminEntityLinkNode(maybeLinkNode)) {
          entityReference = maybeLinkNode.getReference();
        }
      });

      if (url) {
        //TODO handle opening in new tab
        window.open(url, '_blank');
      } else if (entityReference) {
        onEntityLinkClick(entityReference);
      }
    }

    return editor.registerRootListener(
      (rootElement: null | HTMLElement, prevRootElement: null | HTMLElement) => {
        if (prevRootElement) {
          prevRootElement.removeEventListener('click', handleClick);
          //TODO auxclick
        }

        if (rootElement) {
          rootElement.addEventListener('click', handleClick);
          //TODO auxclick
        }
      },
    );
  }, [editor, onEntityLinkClick]);
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
