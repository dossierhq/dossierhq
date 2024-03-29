export interface PrincipalConfig {
  provider: string;
  identifier: string;
  defaultAuthKeys: string[] | null;
  enableAdmin: boolean;
}

const principals = {
  editor: {
    provider: 'sys',
    identifier: 'editor',
    defaultAuthKeys: null,
    enableAdmin: true,
  },
  reader: {
    provider: 'sys',
    identifier: 'reader',
    defaultAuthKeys: null,
    enableAdmin: false,
  },
} satisfies Record<string, PrincipalConfig>;

export type PrincipalIdentifier = keyof typeof principals;

export function getPrincipalConfig(identifier: PrincipalIdentifier): PrincipalConfig {
  return principals[identifier];
}
