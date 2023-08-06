import type {
  AdminEntity,
  AdminEntityCreate,
  EntityLike,
  PublishedEntity,
  RichText,
  RichTextNode,
} from '../Types.js';
import { FieldType, type FieldSpecification } from '../schema/SchemaSpecification.js';
import type { Mutable } from '../utils/TypeUtils.js';
import { isRichTextRootNode } from './ContentTypeUtils.js';

export function isEntityNameAsRequested(currentName: string, requestedName: string): boolean {
  if (requestedName === currentName) {
    return true;
  }
  const hashIndex = currentName.lastIndexOf('#');
  if (hashIndex < 0) {
    return false;
  }
  const currentWithoutUniqueNumber = currentName.slice(0, hashIndex);
  return requestedName === currentWithoutUniqueNumber;
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
): string | null {
  if (fieldSpec.list) {
    if (value !== null && value !== undefined && !Array.isArray(value)) {
      return `Expected a list of ${fieldSpec.type}, got ${typeof value}`;
    }
  }
  return null;
}

export function checkFieldItemTraversable(
  fieldSpec: FieldSpecification,
  value: unknown,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return `Expected single ${fieldSpec.type}, got a list`;
  }

  switch (fieldSpec.type) {
    case FieldType.Boolean: {
      if (typeof value !== 'boolean') {
        return `Expected a boolean, got ${typeof value}`;
      }
      break;
    }
    case FieldType.Entity: {
      if (typeof value !== 'object') {
        return `Expected an entity reference, got ${typeof value}`;
      }
      if (typeof (value as EntityLike).id !== 'string') {
        return `Expected an entity reference with an id, got ${typeof (value as EntityLike).id}`;
      }
      break;
    }
    case FieldType.RichText: {
      if (typeof value !== 'object') {
        return `Expected a RichText object, got ${typeof value}`;
      }
      const root = (value as RichText).root;

      if (!root) {
        return `RichText object is missing root`;
      }

      const rootTraversalError = checkRichTextNodeTraversable(root);
      if (rootTraversalError) {
        return `Invalid RichText root: ${rootTraversalError}`;
      }

      if (!isRichTextRootNode(root)) {
        return `RichText root is not a valid RichText node, (got ${(root as RichTextNode).type})`;
      }
      break;
    }
  }
  return null;
}

export function checkRichTextNodeTraversable(node: RichTextNode): string | null {
  if (!node || typeof node !== 'object') {
    return `Expected a RichText node, got ${typeof node}`;
  }
  if (typeof node.type !== 'string') {
    return `RichText node is missing type`;
  }
  if ('children' in node && !Array.isArray(node.children)) {
    return `RichText node children is not an array`;
  }
  return null;
}
