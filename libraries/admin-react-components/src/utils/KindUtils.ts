export type Kind = 'danger' | 'primary' | '';

export function kindToClassName(kind: Kind | undefined): string {
  return kind ? `dd-bg-${kind}` : '';
}
