import type { EntityReference } from '@dossierhq/core';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js';
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
} from 'lexical';
import { useEffect } from 'react';
import { $isPublishedEntityLinkNode } from './PublishedEntityLinkNode.js';

interface Props {
  onClick: (reference: EntityReference) => void;
}

export function PublishedClickableLinkPlugin({ onClick }: Props): JSX.Element | null {
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

        if ($isPublishedEntityLinkNode(maybeLinkNode)) {
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
      },
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
