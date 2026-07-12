import {
  RichTextNodeType,
  type EntityReference,
  type RichTextEntityLinkNode,
} from '@dossierhq/core';
import { addClassNamesToElement } from '@lexical/utils';
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  createCommand,
  ElementNode,
  type EditorConfig,
  type LexicalCommand,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
} from 'lexical';

type SerializedEntityLinkNode = RichTextEntityLinkNode;

function $createEntityLinkNode(reference: EntityReference): EntityLinkNode {
  return new EntityLinkNode(reference);
}

export function $isEntityLinkNode(node: LexicalNode | undefined | null): node is EntityLinkNode {
  return node instanceof EntityLinkNode;
}

export const TOGGLE_ENTITY_LINK_COMMAND: LexicalCommand<EntityReference | null> = createCommand();

export class EntityLinkNode extends ElementNode {
  __reference: EntityReference;

  static override getType(): string {
    return RichTextNodeType.entityLink;
  }

  static override clone(node: EntityLinkNode): EntityLinkNode {
    return new EntityLinkNode(node.__reference, node.__key);
  }

  constructor(reference: EntityReference, key?: NodeKey) {
    super(key);
    this.__reference = reference;
  }

  setReference(reference: EntityReference) {
    const self = this.getWritable();
    self.__reference = reference;
  }

  getReference(): EntityReference {
    const self = this.getLatest();
    return self.__reference;
  }

  static override importJSON(serializedNode: SerializedEntityLinkNode): EntityLinkNode {
    const node = $createEntityLinkNode(serializedNode.reference);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  override exportJSON(): SerializedEntityLinkNode {
    return {
      ...super.exportJSON(),
      type: RichTextNodeType.entityLink,
      reference: this.__reference,
      version: 1,
    };
  }

  override createDOM(config: EditorConfig, _editor: LexicalEditor): HTMLElement {
    const element = document.createElement('a');
    addClassNamesToElement(element, config.theme.link);
    return element;
  }

  override updateDOM(_prevNode: EntityLinkNode, _dom: HTMLElement, _config: EditorConfig): boolean {
    return false; // no need to recreate the DOM
  }

  override canInsertTextBefore(): false {
    return false;
  }

  override canInsertTextAfter(): false {
    return false;
  }

  override canBeEmpty(): false {
    return false;
  }

  override isInline(): true {
    return true;
  }
}

export function toggleEntityLink(reference: EntityReference | null): void {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return;
  }
  const selectionNodes = selection.extract();

  if (!reference) {
    // Remove all entity links
    replaceParentNodesWithChildren(selectionNodes, $isEntityLinkNode);
  } else {
    if (selectionNodes.length === 1) {
      const firstNode = selectionNodes[0];
      // Update the entity link reference of first or parent node
      const entityLinkNode = $isEntityLinkNode(firstNode) ? firstNode : $getLinkAncestor(firstNode);
      if (entityLinkNode !== null) {
        entityLinkNode.setReference(reference);
        return;
      }
    }

    let prevParent: ElementNode | EntityLinkNode | null = null;
    let entityLinkNode: EntityLinkNode | null = null;

    selectionNodes.forEach((node) => {
      const parent = node.getParent();

      if (
        parent === entityLinkNode ||
        parent === null ||
        ($isElementNode(node) && !node.isInline())
      ) {
        return;
      }

      if ($isEntityLinkNode(parent)) {
        entityLinkNode = parent;
        parent.setReference(reference);
        return;
      }

      if (!parent.is(prevParent)) {
        prevParent = parent;
        entityLinkNode = $createEntityLinkNode(reference);

        if ($isEntityLinkNode(parent)) {
          if (node.getPreviousSibling() === null) {
            parent.insertBefore(entityLinkNode);
          } else {
            parent.insertAfter(entityLinkNode);
          }
        } else {
          node.insertBefore(entityLinkNode);
        }
      }

      if ($isEntityLinkNode(node)) {
        if (node.is(entityLinkNode)) {
          return;
        }
        if (entityLinkNode !== null) {
          const children = node.getChildren();

          for (let i = 0; i < children.length; i++) {
            entityLinkNode.append(children[i]);
          }
        }

        node.remove();
        return;
      }

      if (entityLinkNode !== null) {
        entityLinkNode.append(node);
      }
    });
  }
}

function replaceParentNodesWithChildren(
  nodes: LexicalNode[],
  predicate: (node: LexicalNode) => boolean,
): void {
  for (const node of nodes) {
    const parent = node.getParent();
    if (parent && predicate(parent)) {
      const children = parent.getChildren();
      for (let i = 0; i < children.length; i++) {
        parent.insertBefore(children[i]);
      }
      parent.remove();
    }
  }
}

function $getLinkAncestor(node: LexicalNode): null | EntityLinkNode {
  return $getAncestor(node, $isEntityLinkNode) as EntityLinkNode | null;
}

function $getAncestor(
  node: LexicalNode,
  predicate: (ancestor: LexicalNode) => boolean,
): null | LexicalNode {
  let parent: null | LexicalNode = node;
  while (parent !== null && (parent = parent.getParent()) !== null && !predicate(parent));
  return parent;
}
