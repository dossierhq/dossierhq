import { assertExhaustive, assertIsDefined } from '../utils/Asserts.js';
import type { AdminEntity, AdminEntityCreate, AdminEntityUpdate } from '../Types.js';
import type { AdminSchema } from '../schema/AdminSchema.js';
import type { PublishedSchema } from '../schema/PublishedSchema.js';
import type {
  NumberFieldSpecification,
  RichTextFieldSpecification,
  StringFieldSpecification,
  ValueItemFieldSpecification,
} from '../schema/SchemaSpecification.js';
import type { ContentValuePath } from './ContentPath.js';
import type { ContentTraverseNode } from './ContentTraverser.js';
import { ContentTraverseNodeErrorType, ContentTraverseNodeType } from './ContentTraverser.js';
import {
  isEntityItemField,
  isLocationItemField,
  isNumberItemField,
  isRichTextTextNode,
  isStringItemField,
  isValueItemItemField,
} from './ContentTypeUtils.js';

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
  node: ContentTraverseNode<TSchema>,
  options?: { ignoreExtraContentFields: boolean },
): SaveValidationIssue | null {
  const ignoreExtraContentFields = !!options?.ignoreExtraContentFields;

  const nodeType = node.type;
  switch (nodeType) {
    case ContentTraverseNodeType.entity: {
      // Check if there are any extra fields
      if (!ignoreExtraContentFields) {
        const invalidFields = new Set(Object.keys(node.entity.fields));
        node.entitySpec.fields.forEach((it) => invalidFields.delete(it.name));

        if (invalidFields.size > 0) {
          return {
            type: 'save',
            path: [...node.path, 'fields'],
            message: `Invalid fields for entity of type ${node.entitySpec.name}: ${[
              ...invalidFields,
            ].join(', ')}`,
          };
        }
      }
      break;
    }
    case ContentTraverseNodeType.field:
      break;
    case ContentTraverseNodeType.fieldItem:
      if (isEntityItemField(node.fieldSpec, node.value) && node.value) {
        const invalidKeys = Object.keys(node.value).filter((it) => it !== 'id');
        if (invalidKeys.length > 0) {
          return {
            type: 'save',
            path: node.path,
            message: `Invalid keys for Entity: ${invalidKeys.join(', ')}`,
          };
        }
      } else if (isLocationItemField(node.fieldSpec, node.value) && node.value) {
        const invalidKeys = Object.keys(node.value).filter((it) => it !== 'lat' && it !== 'lng');
        if (invalidKeys.length > 0) {
          return {
            type: 'save',
            path: node.path,
            message: `Invalid keys for Location: ${invalidKeys.join(', ')}`,
          };
        }
      } else if (isNumberItemField(node.fieldSpec, node.value) && node.value !== null) {
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
      } else if (isValueItemItemField(node.fieldSpec, node.value) && node.value) {
        const valueItemFieldSpec = node.fieldSpec as ValueItemFieldSpecification;
        if (
          valueItemFieldSpec.valueTypes.length > 0 &&
          !valueItemFieldSpec.valueTypes.includes(node.value.type)
        ) {
          return {
            type: 'save',
            path: node.path,
            message: `Value item of type ${
              node.value.type
            } is not allowed in field (supported types: ${valueItemFieldSpec.valueTypes.join(
              ', ',
            )})`,
          };
        }
      }
      break;
    case ContentTraverseNodeType.error:
      return { type: 'save', path: node.path, message: node.message };
    case ContentTraverseNodeType.richTextNode: {
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
    case ContentTraverseNodeType.valueItem:
      // Check if there are any extra fields
      if (!ignoreExtraContentFields) {
        const invalidFields = new Set(Object.keys(node.valueItem));
        invalidFields.delete('type');
        node.valueSpec.fields.forEach((it) => invalidFields.delete(it.name));

        if (invalidFields.size > 0) {
          return {
            type: 'save',
            path: node.path,
            message: `Invalid fields for value item of type ${node.valueItem.type}: ${[
              ...invalidFields,
            ].join(', ')}`,
          };
        }
      }
      break;
    default:
      assertExhaustive(nodeType);
  }
  return null;
}

export function validateTraverseNodeForPublish(
  adminSchema: AdminSchema,
  node: ContentTraverseNode<PublishedSchema>,
): PublishValidationIssue | null {
  switch (node.type) {
    case ContentTraverseNodeType.field:
      if (node.fieldSpec.required && node.value === null) {
        return {
          type: 'publish',
          path: node.path,
          message: 'Required field is empty',
        };
      }
      break;
    case ContentTraverseNodeType.error:
      if (
        node.errorType === ContentTraverseNodeErrorType.missingTypeSpec &&
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