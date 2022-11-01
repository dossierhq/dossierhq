export const SYSTEM_USERS = {
  schemaLoader: {
    provider: 'sys',
    identifier: 'schemaloader',
    defaultAuthKeys: [],
  },
  serverRenderer: {
    provider: 'sys',
    identifier: 'serverRenderer',
    defaultAuthKeys: ['none'],
  },
} as const;
