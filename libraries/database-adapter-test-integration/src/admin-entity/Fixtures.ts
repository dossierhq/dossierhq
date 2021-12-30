import type { AdminEntity, AdminEntityCreate } from '@jonasb/datadata-core';
import { AdminEntityStatus } from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';

export const TITLE_ONLY_CREATE: Readonly<AdminEntityCreate> = {
  info: {
    type: 'TitleOnly',
    name: 'TitleOnly name',
    authKey: 'none',
  },
  fields: { title: 'Title' },
};

export const TITLE_ONLY_ENTITY: Readonly<AdminEntity> = {
  id: 'REPLACE',
  info: {
    type: 'TitleOnly',
    name: 'TitleOnly name',
    version: 0,
    authKey: 'none',
    status: AdminEntityStatus.draft,
    createdAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
    updatedAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
  },
  fields: { title: 'Title' },
};
