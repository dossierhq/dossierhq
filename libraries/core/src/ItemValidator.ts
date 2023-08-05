import { assertExhaustive, assertIsDefined } from './Asserts.js';
import type { ItemTraverseNode } from './ItemTraverser.js';
import { ItemTraverseNodeErrorType, ItemTraverseNodeType } from './ItemTraverser.js';
import { isNumberItemField, isRichTextTextNode, isStringItemField } from './ItemUtils.js';
import type { AdminEntity, AdminEntityCreate, AdminEntityUpdate } from './Types.js';
import type { ContentValuePath } from './content/ContentPath.js';
import type { AdminSchema } from './schema/AdminSchema.js';
import type { PublishedSchema } from './schema/PublishedSchema.js';
import type {
  NumberFieldSpecification,
  RichTextFieldSpecification,
  StringFieldSpecification,
} from './schema/SchemaSpecification.js';

export interface SaveValidationIssue {
  type: 'save';
  path: ContentValuePath;
  message: string;
}

export interface PublishValidationIssue {
  type: 'publish';
  path: ContentValuePath;
  message: string;
}

const LINE_BREAK_REGEX = /[\r\n]/;

export function validateEntityInfo(
  adminSchema: AdminSchema,
  path: ContentValuePath,
  entity: AdminEntity,
): SaveValidationIssue | null {
  // info.type, info.authKey
  const typeAuthKeyValidation = validateTypeAndAuthKey(adminSchema, path, entity);
  if (typeAuthKeyValidation) return typeAuthKeyValidation;

  // info.name
  const saveValidation = validateName(path, entity.info.name);
  if (saveValidation) return saveValidation;

  return null;
}

export function validateEntityInfoForCreate(
  adminSchema: AdminSchema,
  path: ContentValuePath,
  entity: AdminEntityCreate,
): SaveValidationIssue | null {
  // info.type, info.authKey
  const typeAuthKeyValidation = validateTypeAndAuthKey(adminSchema, path, entity);
  if (typeAuthKeyValidation) return typeAuthKeyValidation;

  // info.name
  const saveValidation = validateName(path, entity.info.name);
  if (saveValidation) return saveValidation;

  // info.version
  const version = entity.info.version;
  if (version !== undefined && version !== 0) {
    return {
      type: 'save',
      path: [...path, 'info', 'version'],
      message: `Version must be 0 when creating a new entity`,
    };
  }

  return null;
}

export function validateEntityInfoForUpdate(
  path: ContentValuePath,
  existingEntity: { info: { type: string; authKey: string; version: number } },
  entity: AdminEntityUpdate,
): SaveValidationIssue | null {
  if (entity.info?.type && entity.info.type !== existingEntity.info.type) {
    return {
      type: 'save',
      path: [...path, 'info', 'type'],
      message: `New type ${entity.info.type} doesn’t correspond to previous type ${existingEntity.info.type}`,
    };
  }

  if (entity.info?.authKey && entity.info.authKey !== existingEntity.info.authKey) {
    return {
      type: 'save',
      path: [...path, 'info', 'authKey'],
      message: `New authKey ${entity.info.authKey} doesn’t correspond to previous authKey ${existingEntity.info.authKey}`,
    };
  }

  if (entity.info?.name) {
    const saveValidation = validateName(path, entity.info.name);
    if (saveValidation) return saveValidation;
  }

  const expectedVersion = existingEntity.info.version + 1;
  if (entity.info?.version !== undefined && entity.info.version !== expectedVersion) {
    return {
      type: 'save',
      path: [...path, 'info', 'version'],
      message: `The latest version of the entity is ${existingEntity.info.version}, so the new version must be ${expectedVersion} (got ${entity.info.version})`,
    };
  }

  return null;
}

function validateTypeAndAuthKey(
  adminSchema: AdminSchema,
  path: ContentValuePath,
  entity: AdminEntityCreate | AdminEntity,
): SaveValidationIssue | null {
  // info.type
  const type = entity.info.type;
  if (!type) {
    return { type: 'save', path: [...path, 'info', 'type'], message: 'Type is required' };
  }

  const entitySpec = adminSchema.getEntityTypeSpecification(type);
  if (!entitySpec) {
    return {
      type: 'save',
      path: [...path, 'info', 'type'],
      message: `Entity type ${type} doesn’t exist`,
    };
  }

  // info.authKey
  const authKey = entity.info.authKey;
  if (!authKey) {
    return { type: 'save', path: [...path, 'info', 'authKey'], message: 'AuthKey is required' };
  }

  if (entitySpec.authKeyPattern) {
    const authKeyRegExp = adminSchema.getPatternRegExp(entitySpec.authKeyPattern);
    if (!authKeyRegExp) {
      return {
        type: 'save',
        path: [...path, 'info', 'authKey'],
        message: `Pattern '${entitySpec.authKeyPattern}' for authKey of type '${entitySpec.name}' not found`,
      };
    }
    if (!authKeyRegExp.test(authKey)) {
      return {
        type: 'save',
        path: ['info', 'authKey'],
        message: `AuthKey '${authKey}' does not match pattern '${entitySpec.authKeyPattern}' (${authKeyRegExp.source})`,
      };
    }
  }

  return null;
}

function validateName(path: ContentValuePath, name: string): SaveValidationIssue | null {
  if (!name) {
    return { type: 'save', path: [...path, 'info', 'name'], message: 'Name is required' };
  }
  if (LINE_BREAK_REGEX.test(name)) {
    return {
      type: 'save',
      path: [...path, 'info', 'name'],
      message: 'Name cannot contain line breaks',
    };
  }

  return null;
}

export function validateTraverseNodeForSave<TSchema extends AdminSchema | PublishedSchema>(
  schema: TSchema,
  node: ItemTraverseNode<TSchema>,
): SaveValidationIssue | null {
  const nodeType = node.type;
  switch (nodeType) {
    case ItemTraverseNodeType.field:
      break;
    case ItemTraverseNodeType.fieldItem:
      if (isNumberItemField(node.fieldSpec, node.value) && node.value !== null) {
        const numberFieldSpec = node.fieldSpec as NumberFieldSpecification;
        if (numberFieldSpec.integer && !Number.isInteger(node.value)) {
          return {
            type: 'save',
            path: node.path,
            message: 'Value must be an integer',
          };
        }
      } else if (isStringItemField(node.fieldSpec, node.value) && node.value) {
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
        if (!stringFieldSpec.multiline && LINE_BREAK_REGEX.test(node.value)) {
          return {
            type: 'save',
            path: node.path,
            message: 'Value cannot contain line breaks',
          };
        }
        if (stringFieldSpec.values.length > 0) {
          const match = stringFieldSpec.values.some((it) => it.value === node.value);
          if (!match) {
            return {
              type: 'save',
              path: node.path,
              message: 'Value does not match any of the allowed values',
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
              ', ',
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
  node: ItemTraverseNode<PublishedSchema>,
): PublishValidationIssue | null {
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

export function groupValidationIssuesByTopLevelPath<
  TError extends SaveValidationIssue | PublishValidationIssue,
>(
  errors: TError[],
): {
  root: TError[];
  children: Map<number | string, TError[]>;
} {
  const root: TError[] = [];
  const children = new Map<number | string, TError[]>();
  for (const error of errors) {
    if (error.path.length === 0) {
      root.push(error);
    } else {
      const [topLevel, ...rest] = error.path;
      const newError = { ...error, path: rest };

      const existingErrors = children.get(topLevel);
      if (existingErrors) {
        existingErrors.push(newError);
      } else {
        children.set(topLevel, [newError]);
      }
    }
  }
  return { root, children };
}
