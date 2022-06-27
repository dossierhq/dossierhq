import { assertExhaustive } from './Asserts.js';
import type { AdminItemTraverseNode } from './ItemTraverser.js';
import { AdminItemTraverseNodeType } from './ItemTraverser.js';
import type { ItemValuePath } from './ItemUtils.js';
import type { AdminSchema } from './Schema.js';

export interface ValidationError {
  path: ItemValuePath;
  message: string;
}

export function validateTraverseNode(
  schema: AdminSchema,
  node: AdminItemTraverseNode,
  { validatePublish: _1 }: { validatePublish: boolean }
): ValidationError | null {
  const nodeType = node.type;
  switch (nodeType) {
    case AdminItemTraverseNodeType.field:
      break;
    case AdminItemTraverseNodeType.fieldItem:
      break;
    case AdminItemTraverseNodeType.error:
      return { path: node.path, message: node.message };
    case AdminItemTraverseNodeType.valueItem:
      break;
    default:
      assertExhaustive(nodeType);
  }
  return null;
}
