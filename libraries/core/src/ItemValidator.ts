import { assertExhaustive, assertIsDefined } from './Asserts.js';
import type { ItemTraverseNode } from './ItemTraverser.js';
import { ItemTraverseNodeType } from './ItemTraverser.js';
import type { ItemValuePath } from './ItemUtils.js';
import { isStringItemField } from './ItemUtils.js';
import type {
  AdminSchema,
  RichTextFieldSpecification,
  StringFieldSpecification,
} from './Schema.js';

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
        const stringFieldSpec = node.fieldSpec as StringFieldSpecification;
        if (stringFieldSpec.matchPattern) {
          const regexp = schema.getPatternRegExp(stringFieldSpec.matchPattern);
          assertIsDefined(regexp);
          if (!regexp.test(node.value)) {
            return {
              type: 'save',
              path: node.path,
              message: `Value does not match pattern ${stringFieldSpec.matchPattern}`,
            };
          }
        }
      }
      break;
    case ItemTraverseNodeType.error:
      return { type: 'save', path: node.path, message: node.message };
    case ItemTraverseNodeType.richTextNode: {
      const richTextFieldSpec = node.fieldSpec as RichTextFieldSpecification;
      if (richTextFieldSpec.richTextNodes && richTextFieldSpec.richTextNodes.length > 0) {
        if (!richTextFieldSpec.richTextNodes.includes(node.node.type)) {
          return {
            type: 'save',
            path: node.path,
            message: `Rich text node type ${
              node.node.type
            } is not allowed in field (supported nodes: ${richTextFieldSpec.richTextNodes.join(
              ', '
            )})`,
          };
        }
      }
      break;
    }
    case ItemTraverseNodeType.valueItem:
      break;
    default:
      assertExhaustive(nodeType);
  }
  return null;
}
