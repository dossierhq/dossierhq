export function toAdminTypeName(name: string, isAdmin = true) {
  if (isAdmin && name === 'Entity') {
    return 'Entity';
  }
  return isAdmin ? `Admin${name}` : toPublishedTypeName(name);
}

export function toPublishedTypeName(name: string) {
  return `Published${name}`;
}

export function toAdminCreateInputTypeName(name: string) {
  return `Admin${name}CreateInput`;
}

export function toAdminCreatePayloadTypeName(name: string) {
  return `Admin${name}CreatePayload`;
}

export function toAdminUpdateInputTypeName(name: string) {
  return `Admin${name}UpdateInput`;
}

export function toAdminUpdatePayloadTypeName(name: string) {
  return `Admin${name}UpdatePayload`;
}

export function toAdminUpsertInputTypeName(name: string) {
  return `Admin${name}UpsertInput`;
}

export function toAdminUpsertPayloadTypeName(name: string) {
  return `Admin${name}UpsertPayload`;
}

export function toAdminComponentInputTypeName(name: string) {
  return `Admin${name}Input`;
}

export function toEnumName(names: string[], isAdmin: boolean) {
  return `_${toAdminTypeName(names.join('Or'), isAdmin)}`;
}
