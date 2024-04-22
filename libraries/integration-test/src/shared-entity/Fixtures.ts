import {
  EntityStatus,
  normalizeEntityFields,
  type Entity,
  type EntityCreate,
  type EntityUpsert,
  type PublishedEntity,
  type Schema,
} from '@dossierhq/core';
import { assertEquals } from '../Asserts.js';
import type {
  AppEntity,
  AppPublishedEntity,
  ChangeValidations,
  Components,
  Locations,
  MigrationEntity,
  PublishedTitleOnly,
  References,
  RichTexts,
  Strings,
  SubjectOnly,
  SubjectOrDefaultAuthKey,
  TitleOnly,
} from '../SchemaTypes.js';

export const CHANGE_VALIDATIONS_CREATE: Readonly<EntityCreate<ChangeValidations>> = {
  info: {
    type: 'ChangeValidations',
    name: 'ChangeValidations name',
  },
  fields: {},
};

export const LOCATIONS_CREATE: Readonly<EntityCreate<Locations>> = {
  info: {
    type: 'Locations',
    name: 'Locations name',
  },
  fields: {},
};

export const LOCATIONS_ADMIN_ENTITY: Readonly<Locations> = {
  id: 'REPLACE',
  info: {
    type: 'Locations',
    name: 'Locations name',
    version: 1,
    authKey: '',
    status: EntityStatus.draft,
    valid: true,
    validPublished: null,
    createdAt: new Date('2021-08-17T07:51:25.56Z'),
    updatedAt: new Date('2021-08-17T07:51:25.56Z'),
  },
  fields: { location: null, locationList: null, locationAdminOnly: null },
};

export const MIGRATIONS_ENTITY_CREATE: Readonly<EntityCreate<MigrationEntity>> = {
  info: { name: 'MigrationEntity name', type: 'MigrationEntity' },
  fields: {},
};

export const REFERENCES_CREATE: Readonly<EntityCreate<References>> = {
  info: {
    type: 'References',
    name: 'References name',
  },
  fields: {},
};

export const REFERENCES_ADMIN_ENTITY: Readonly<References> = {
  id: 'REPLACE',
  info: {
    type: 'References',
    name: 'References name',
    version: 1,
    authKey: '',
    status: EntityStatus.draft,
    valid: true,
    validPublished: null,
    createdAt: new Date('2021-08-17T07:51:25.56Z'),
    updatedAt: new Date('2021-08-17T07:51:25.56Z'),
  },
  fields: { any: null, anyList: null, anyAdminOnly: null, titleOnly: null },
};

export const RICH_TEXTS_CREATE: Readonly<EntityCreate<RichTexts>> = {
  info: {
    type: 'RichTexts',
    name: 'RichTexts name',
  },
  fields: {},
};

export const RICH_TEXTS_ADMIN_ENTITY: Readonly<RichTexts> = {
  id: 'REPLACE',
  info: {
    type: 'RichTexts',
    name: 'RichTexts name',
    authKey: '',
    version: 1,
    status: EntityStatus.draft,
    valid: true,
    validPublished: null,
    createdAt: new Date('2021-08-17T07:51:25.56Z'),
    updatedAt: new Date('2021-08-17T07:51:25.56Z'),
  },
  fields: {
    richText: null,
    richTextList: null,
    richTextMinimal: null,
    richTextLimitedTypes: null,
  },
};

export const STRINGS_CREATE: Readonly<EntityCreate<Strings>> = {
  info: {
    type: 'Strings',
    name: 'Strings name',
  },
  fields: { multiline: 'Hello\nWorld' },
};

export const STRINGS_ADMIN_ENTITY: Readonly<Strings> = {
  id: 'REPLACE',
  info: {
    type: 'Strings',
    name: 'Strings name',
    version: 1,
    authKey: '',
    status: EntityStatus.draft,
    valid: true,
    validPublished: null,
    createdAt: new Date('2021-08-17T07:51:25.56Z'),
    updatedAt: new Date('2021-08-17T07:51:25.56Z'),
  },
  fields: {
    multiline: 'Hello\nWorld',
    stringAdminOnly: null,
    pattern: null,
    patternList: null,
    values: null,
    valuesList: null,
    unique: null,
    uniqueAdminOnly: null,
    uniqueGenericIndex: null,
  },
};

export const SUBJECT_ONLY_CREATE: Readonly<EntityCreate<SubjectOnly>> = {
  info: {
    type: 'SubjectOnly',
    name: 'SubjectOnly name',
    authKey: 'subject',
  },
  fields: { message: 'Message' },
};

export const SUBJECT_ONLY_UPSERT: Readonly<EntityUpsert<SubjectOnly>> = {
  id: 'REPLACE',
  ...SUBJECT_ONLY_CREATE,
};

export const SUBJECT_ONLY_ADMIN_ENTITY: Readonly<SubjectOnly> = {
  id: 'REPLACE',
  info: {
    type: 'SubjectOnly',
    name: 'SubjectOnly name',
    version: 1,
    authKey: 'subject',
    status: EntityStatus.draft,
    valid: true,
    validPublished: null,
    createdAt: new Date('2021-08-17T07:51:25.56Z'),
    updatedAt: new Date('2021-08-17T07:51:25.56Z'),
  },
  fields: { message: 'Message' },
};

export const SUBJECT_OR_DEFAULT_CREATE: Readonly<EntityCreate<SubjectOrDefaultAuthKey>> = {
  info: {
    type: 'SubjectOrDefaultAuthKey',
    name: 'SubjectOrDefaultAuthKey name',
    authKey: 'subject',
  },
  fields: { message: 'Message' },
};

export const SUBJECT_OR_DEFAULT_UPSERT: Readonly<EntityUpsert<SubjectOrDefaultAuthKey>> = {
  id: 'REPLACE',
  ...SUBJECT_OR_DEFAULT_CREATE,
};

export const TITLE_ONLY_CREATE: Readonly<EntityCreate<TitleOnly>> = {
  info: {
    type: 'TitleOnly',
    name: 'TitleOnly name',
  },
  fields: { title: 'Title' },
};

export const TITLE_ONLY_UPSERT: Readonly<EntityUpsert<TitleOnly>> = {
  id: 'REPLACE',
  ...TITLE_ONLY_CREATE,
};

export const TITLE_ONLY_ADMIN_ENTITY: Readonly<TitleOnly> = {
  id: 'REPLACE',
  info: {
    type: 'TitleOnly',
    name: 'TitleOnly name',
    version: 1,
    authKey: '',
    status: EntityStatus.draft,
    valid: true,
    validPublished: null,
    createdAt: new Date('2021-08-17T07:51:25.56Z'),
    updatedAt: new Date('2021-08-17T07:51:25.56Z'),
  },
  fields: { title: 'Title' },
};

export const TITLE_ONLY_PUBLISHED_ENTITY: Readonly<PublishedTitleOnly> = {
  id: 'REPLACE',
  info: {
    type: 'TitleOnly',
    name: 'TitleOnly name',
    authKey: '',
    valid: true,
    createdAt: new Date('2021-08-17T07:51:25.56Z'),
  },
  fields: { title: 'Title' },
};

export const VALUE_ITEMS_CREATE: Readonly<EntityCreate<Components>> = {
  info: {
    type: 'Components',
    name: 'Components name',
  },
  fields: {},
};

export function adminToPublishedEntity<T extends AppEntity>(
  schema: Schema,
  entity: T,
): AppPublishedEntity {
  assertEquals(entity.info.status, EntityStatus.published);

  const result = normalizeEntityFields(schema.toPublishedSchema(), [], entity as Entity);

  const {
    id,
    info: { name, type, authKey, validPublished, createdAt },
  } = entity;
  const publishedEntity: PublishedEntity = {
    id,
    info: {
      type,
      name,
      authKey,
      valid: validPublished ?? false,
      createdAt,
    },
    fields: result.valueOrThrow() as unknown as PublishedEntity['fields'],
  };

  return publishedEntity as AppPublishedEntity;
}
