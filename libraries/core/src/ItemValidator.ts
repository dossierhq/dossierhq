import { assertExhaustive, assertIsDefined } from './Asserts.js';
import type { ItemTraverseNode } from './ItemTraverser.js';
import { ItemTraverseNodeType } from './ItemTraverser.js';
import type { ItemValuePath } from './ItemUtils.js';
import { isStringItemField } from './ItemUtils.js';
import type { AdminSchema } from './Schema.js';

export interface ValidationError {
  type: 'save' | 'publish';
  path: ItemValuePath;
  message: string;
}

export interface ValidationOptions {
  validatePublish: boolean;
}

export function validateTraverseNode(
  schema: AdminSchema,
  node: ItemTraverseNode<AdminSchema>,
  { validatePublish: _1 }: ValidationOptions
): ValidationError | null {
  const nodeType = node.type;
  switch (nodeType) {
    case ItemTraverseNodeType.field:
      break;
    case ItemTraverseNodeType.fieldItem:
      if (isStringItemField(node.fieldSpec, node.value) && node.value) {
        if (node.fieldSpec.matchPattern) {
          const regexp = schema.getPatternRegExp(node.fieldSpec.matchPattern);
          assertIsDefined(regexp);
          if (!regexp.test(node.value)) {
            return {
              type: 'save',
              path: node.path,
              message: `Value does not match pattern ${node.fieldSpec.matchPattern}`,
            };
          }
        }
      }
      break;
    case ItemTraverseNodeType.error:
      return { type: 'save', path: node.path, message: node.message };
    case ItemTraverseNodeType.richTextNode:
      if (node.fieldSpec.richTextNodes && node.fieldSpec.richTextNodes.length > 0) {
        if (!node.fieldSpec.richTextNodes.includes(node.node.type)) {
          return {
            type: 'save',
            path: node.path,
            message: `Rich text node type ${
              node.node.type
            } is not allowed in field (supported nodes: ${node.fieldSpec.richTextNodes.join(
              ', '
            )})`,
          };
        }
      }
      break;
    case ItemTraverseNodeType.valueItem:
      break;
    default:
      assertExhaustive(nodeType);
  }
  return null;
}
