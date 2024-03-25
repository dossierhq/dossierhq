export const SYSTEM_USERS = {
  schemaLoader: {
    provider: 'sys',
    identifier: 'schemaloader',
    defaultAuthKeys: [],
  },
  serverRenderer: {
    provider: 'sys',
    identifier: 'serverRenderer',
    defaultAuthKeys: [''],
  },
  editor: {
    provider: 'sys',
    identifier: 'editor',
    defaultAuthKeys: [''],
  },
} as const;
