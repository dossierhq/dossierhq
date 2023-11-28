import { DEFAULT_AUTH_KEYS } from './AuthKeyConfig.ts';

export interface PrincipalConfig {
  provider: string;
  identifier: string;
  defaultAuthKeys: string[];
  enableAdmin: boolean;
}

const principals = {
  editor: {
    provider: 'sys',
    identifier: 'editor',
    defaultAuthKeys: DEFAULT_AUTH_KEYS,
    enableAdmin: true,
  },
  reader: {
    provider: 'sys',
    identifier: 'reader',
    defaultAuthKeys: ['none'],
    enableAdmin: false,
  },
} satisfies Record<string, PrincipalConfig>;

export type PrincipalIdentifier = keyof typeof principals;

export function getPrincipalConfig(identifier: PrincipalIdentifier): PrincipalConfig {
  return principals[identifier];
}
