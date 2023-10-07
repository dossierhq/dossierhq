import type {
  AdminEntity,
  AdminEntityCreate,
  EntityLike,
  Location,
  PublishedEntity,
  RichText,
  RichTextNode,
} from '../Types.js';
import { FieldType, type FieldSpecification } from '../schema/SchemaSpecification.js';
import { assertExhaustive } from '../utils/Asserts.js';
import type { Mutable } from '../utils/TypeUtils.js';
import type { ContentValuePath } from './ContentPath.js';
import { isRichTextRootNode } from './ContentTypeUtils.js';

export function getEntityNameBase(name: string): string {
  const hashIndex = name.lastIndexOf('#');
  if (hashIndex < 0) {
    return name;
  }
  return name.slice(0, hashIndex);
}

export function isEntityNameAsRequested(currentName: string, requestedName: string): boolean {
  if (requestedName === currentName) {
    return true;
  }
  const currentNameBase = getEntityNameBase(currentName);
  return requestedName === currentNameBase;
}

export function copyEntity<
  T extends
    | AdminEntity<string, object>
    | AdminEntityCreate<AdminEntity<string, object>>
    | PublishedEntity<string, object>
    | EntityLike<string, object>,
>(
  entity: Readonly<T> | T,
  changes: { id?: string; info?: Partial<T['info']>; fields?: Partial<T['fields']> },
): Readonly<T> {
  const copy: Mutable<T> = { ...entity };
  if (typeof changes.id === 'string') {
    copy.id = changes.id;
  }
  if (changes.info) {
    copy.info = { ...entity.info };
    for (const [key, value] of Object.entries(changes.info)) {
      (copy.info as unknown as Record<string, unknown>)[key] = value;
    }
  }
  if (changes.fields) {
    const fieldsCopy = { ...entity.fields } as Record<string, unknown>;
    copy.fields = fieldsCopy;
    for (const [key, value] of Object.entries(changes.fields)) {
      fieldsCopy[key] = value;
    }
  }
  return copy;
}

export function checkFieldTraversable(
  fieldSpec: FieldSpecification,
  value: unknown,
): { path: ContentValuePath; message: string } | null {
  if (fieldSpec.list) {
    if (value !== null && value !== undefined && !Array.isArray(value)) {
      return { path: [], message: `Expected a list of ${fieldSpec.type}, got ${typeof value}` };
    }
  }
  return null;
}

export function checkFieldItemTraversable(
  fieldSpec: FieldSpecification,
  value: unknown,
): { path: ContentValuePath; message: string } | null {
  const { type } = fieldSpec;

  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return { path: [], message: `Expected single ${type}, got a list` };
  }

  switch (type) {
    case FieldType.Boolean: {
      if (typeof value !== 'boolean') {
        return { path: [], message: `Expected a boolean, got ${typeof value}` };
      }
      break;
    }
    case FieldType.Component: {
      if (typeof value !== 'object') {
        return { path: [], message: `Expected a Component object, got ${typeof value}` };
      }
      if (!('type' in value)) {
        return { path: ['type'], message: `Missing a Component type` };
      }
      if (typeof value.type !== 'string') {
        return { path: ['type'], message: `Expected a Component type, got ${typeof value}` };
      }
      break;
    }
    case FieldType.Entity: {
      if (typeof value !== 'object') {
        return { path: [], message: `Expected an entity reference, got ${typeof value}` };
      }
      if (typeof (value as EntityLike).id !== 'string') {
        return {
          path: ['id'],
          message: `Expected an entity reference id, got ${typeof (value as EntityLike).id}`,
        };
      }
      break;
    }
    case FieldType.Location: {
      if (typeof value !== 'object') {
        return { path: [], message: `Expected a Location object, got ${typeof value}` };
      }
      const { lat, lng } = value as Location;
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return {
          path: [],
          message: `Expected {lat: number, lng: number}, got {lat: ${typeof lat}, lng: ${typeof lng}}`,
        };
      }
      break;
    }
    case FieldType.Number: {
      if (typeof value !== 'number') {
        return { path: [], message: `Expected a number, got ${typeof value}` };
      }
      break;
    }
    case FieldType.RichText: {
      if (typeof value !== 'object') {
        return { path: [], message: `Expected a RichText object, got ${typeof value}` };
      }
      const root = (value as RichText).root;

      if (!root) {
        return { path: [], message: `RichText object is missing root` };
      }

      const rootTraversalError = checkRichTextNodeTraversable(root);
      if (rootTraversalError) {
        return { path: ['root', ...rootTraversalError.path], message: rootTraversalError.message };
      }

      if (!isRichTextRootNode(root)) {
        return {
          path: ['root'],
          message: `RichText root is not a valid RichText node, (got ${
            (root as RichTextNode).type
          })`,
        };
      }
      break;
    }
    case FieldType.String: {
      if (typeof value !== 'string') {
        return { path: [], message: `Expected a string, got ${typeof value}` };
      }
      break;
    }
    default:
      assertExhaustive(type);
  }
  return null;
}

export function checkRichTextNodeTraversable(
  node: RichTextNode,
): { path: ContentValuePath; message: string } | null {
  if (!node || typeof node !== 'object') {
    return { path: [], message: `Expected a RichText node, got ${typeof node}` };
  }
  if (typeof node.type !== 'string') {
    return { path: [], message: `RichText node is missing type` };
  }
  if ('children' in node && !Array.isArray(node.children)) {
    return { path: [], message: `RichText node children is not an array` };
  }
  return null;
}
