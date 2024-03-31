export const SYSTEM_USERS = {
  serverRenderer: {
    provider: 'sys',
    identifier: 'serverRenderer',
    readonly: true,
  },
  editor: {
    provider: 'sys',
    identifier: 'editor',
  },
} as const;
