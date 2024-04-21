export function toAdminTypeName(name: string, isAdmin = true) {
  return isAdmin ? `${name}` : toPublishedTypeName(name);
}

export function toPublishedTypeName(name: string) {
  return `Published${name}`;
}

export function toAdminCreateInputTypeName(name: string) {
  return `${name}CreateInput`;
}

export function toAdminCreatePayloadTypeName(name: string) {
  return `${name}CreatePayload`;
}

export function toAdminUpdateInputTypeName(name: string) {
  return `${name}UpdateInput`;
}

export function toAdminUpdatePayloadTypeName(name: string) {
  return `${name}UpdatePayload`;
}

export function toAdminUpsertInputTypeName(name: string) {
  return `${name}UpsertInput`;
}

export function toAdminUpsertPayloadTypeName(name: string) {
  return `${name}UpsertPayload`;
}

export function toAdminComponentInputTypeName(name: string) {
  return `${name}Input`;
}

export function toEnumName(names: string[], isAdmin: boolean) {
  return `_${toAdminTypeName(names.join('Or'), isAdmin)}`;
}
