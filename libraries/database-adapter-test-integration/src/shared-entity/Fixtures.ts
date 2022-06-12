import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpsert,
  PublishedEntity,
} from '@jonasb/datadata-core';
import { AdminEntityStatus } from '@jonasb/datadata-core';
import { Temporal } from '@js-temporal/polyfill';
import { assertEquals } from '../Asserts.js';

export const LOCATIONS_CREATE: Readonly<AdminEntityCreate> = {
  info: {
    type: 'Locations',
    name: 'Locations name',
    authKey: 'none',
  },
  fields: {},
};

export const LOCATIONS_ADMIN_ENTITY: Readonly<AdminEntity> = {
  id: 'REPLACE',
  info: {
    type: 'Locations',
    name: 'Locations name',
    version: 0,
    authKey: 'none',
    status: AdminEntityStatus.draft,
    createdAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
    updatedAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
  },
  fields: { location: null, locationList: null },
};

export const REFERENCES_CREATE: Readonly<AdminEntityCreate> = {
  info: {
    type: 'References',
    name: 'References name',
    authKey: 'none',
  },
  fields: {},
};

export const REFERENCES_ADMIN_ENTITY: Readonly<AdminEntity> = {
  id: 'REPLACE',
  info: {
    type: 'References',
    name: 'References name',
    version: 0,
    authKey: 'none',
    status: AdminEntityStatus.draft,
    createdAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
    updatedAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
  },
  fields: { any: null, anyList: null, titleOnly: null },
};

export const STRINGS_CREATE: Readonly<AdminEntityCreate> = {
  info: {
    type: 'Strings',
    name: 'Strings name',
    authKey: 'none',
  },
  fields: { multiline: 'Hello\nWorld' },
};

export const STRINGS_ADMIN_ENTITY: Readonly<AdminEntity> = {
  id: 'REPLACE',
  info: {
    type: 'Strings',
    name: 'Strings name',
    version: 0,
    authKey: 'none',
    status: AdminEntityStatus.draft,
    createdAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
    updatedAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
  },
  fields: { multiline: 'Hello\nWorld' },
};

export const TITLE_ONLY_CREATE: Readonly<AdminEntityCreate> = {
  info: {
    type: 'TitleOnly',
    name: 'TitleOnly name',
    authKey: 'none',
  },
  fields: { title: 'Title' },
};

export const TITLE_ONLY_UPSERT: Readonly<AdminEntityUpsert> = {
  id: 'REPLACE',
  info: {
    type: 'TitleOnly',
    name: 'TitleOnly name',
    authKey: 'none',
  },
  fields: { title: 'Title' },
};

export const TITLE_ONLY_ADMIN_ENTITY: Readonly<AdminEntity> = {
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

export const TITLE_ONLY_PUBLISHED_ENTITY: Readonly<PublishedEntity> = {
  id: 'REPLACE',
  info: {
    type: 'TitleOnly',
    name: 'TitleOnly name',
    authKey: 'none',
    createdAt: Temporal.Instant.from('2021-08-17T07:51:25.56Z'),
  },
  fields: { title: 'Title' },
};

export function adminToPublishedEntity(entity: AdminEntity): PublishedEntity {
  assertEquals(entity.info.status, AdminEntityStatus.published);
  const {
    id,
    info: { name, type, authKey, createdAt },
    fields,
  } = entity;
  const result: PublishedEntity = {
    id,
    info: {
      type,
      name,
      authKey,
      createdAt,
    },
    fields,
  };
  return result;
}
