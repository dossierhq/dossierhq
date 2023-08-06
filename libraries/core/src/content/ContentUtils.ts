import type { AdminEntity, AdminEntityCreate, EntityLike, PublishedEntity } from '../Types.js';
import type { Mutable } from '../utils/TypeUtils.js';

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
