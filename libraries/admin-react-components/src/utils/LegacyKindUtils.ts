export type LegacyKind = 'danger' | 'primary' | '';

export function kindToClassName(kind: LegacyKind | undefined): string {
  return kind ? `dd-bg-${kind}` : '';
}
