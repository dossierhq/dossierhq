import type { DisplayAuthKey } from '@dossierhq/react-components';

export const DISPLAY_AUTH_KEYS: DisplayAuthKey[] = [
  { authKey: 'none', displayName: 'None' },
  { authKey: 'subject', displayName: 'User private' },
];

export const DEFAULT_AUTH_KEYS = ['none', 'subject'];
