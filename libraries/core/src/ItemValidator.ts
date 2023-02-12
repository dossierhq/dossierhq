import { assertExhaustive, assertIsDefined } from './Asserts.js';
import type { ItemTraverseNode } from './ItemTraverser.js';
import { ItemTraverseNodeErrorType, ItemTraverseNodeType } from './ItemTraverser.js';
import type { ItemValuePath } from './ItemUtils.js';
import { isRichTextTextNode, isStringItemField } from './ItemUtils.js';
import type {
  AdminSchema,
  PublishedSchema,
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

const LINE_BREAK_REGEX = /[\r\n]/;

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

      if (isRichTextTextNode(node.node)) {
        if (LINE_BREAK_REGEX.test(node.node.text)) {
          return {
            type: 'save',
            path: node.path,
            message: 'Rich text text nodes cannot contain line breaks, use linebreak nodes instead',
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

export function validateTraverseNodeForPublish(
  adminSchema: AdminSchema,
  node: ItemTraverseNode<PublishedSchema>
): ValidationError | null {
  switch (node.type) {
    case ItemTraverseNodeType.field:
      if (node.fieldSpec.required && node.value === null) {
        return {
          type: 'publish',
          path: node.path,
          message: 'Required field is empty',
        };
      }
      break;
    case ItemTraverseNodeType.error:
      if (
        node.errorType === ItemTraverseNodeErrorType.missingTypeSpec &&
        node.kind === 'valueItem'
      ) {
        const adminTypeSpec = adminSchema.getValueTypeSpecification(node.typeName);
        if (adminTypeSpec && adminTypeSpec.adminOnly) {
          return {
            type: 'publish',
            path: node.path,
            message: `Value item of type ${node.typeName} is adminOnly`,
          };
        }
      }
      return { type: 'publish', path: node.path, message: node.message };
  }
  return null;
}
