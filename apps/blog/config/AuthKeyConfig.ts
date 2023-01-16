import type { DisplayAuthKey } from '@dossierhq/react-components';

export const DISPLAY_AUTH_KEYS: DisplayAuthKey[] = [
  { authKey: 'none', displayName: 'None' },
  { authKey: 'subject', displayName: 'User private' },
];

export const AUTH_KEYS_HEADER = {
  'DataData-Default-Auth-Keys': DISPLAY_AUTH_KEYS.map((it) => it.authKey).join(', '),
};
