import type {
  AdminEntityCreate,
  AdminEntityUpsert,
  AdminFieldSpecification,
  AdminSchema,
  EntityLike,
  PublishedEntity,
} from '@dossierhq/core';
import { AdminEntityStatus, assertIsDefined } from '@dossierhq/core';
import { assertEquals } from '../Asserts.js';
import type {
  AdminChangeValidations,
  AdminLocations,
  AdminMigrationEntity,
  AdminReferences,
  AdminRichTexts,
  AdminStrings,
  AdminSubjectOnly,
  AdminTitleOnly,
  AdminValueItems,
  AppAdminEntity,
  AppPublishedEntity,
  PublishedTitleOnly,
} from '../SchemaTypes.js';

export const CHANGE_VALIDATIONS_CREATE: Readonly<AdminEntityCreate<AdminChangeValidations>> = {
  info: {
    type: 'ChangeValidations',
    name: 'ChangeValidations name',
    authKey: 'none',
  },
  fields: {},
};

export const LOCATIONS_CREATE: Readonly<AdminEntityCreate<AdminLocations>> = {
  info: {
    type: 'Locations',
    name: 'Locations name',
    authKey: 'none',
  },
  fields: {},
};

export const LOCATIONS_ADMIN_ENTITY: Readonly<AdminLocations> = {
  id: 'REPLACE',
  info: {
    type: 'Locations',
    name: 'Locations name',
    version: 0,
    authKey: 'none',
    status: AdminEntityStatus.draft,
    valid: true,
    validPublished: null,
    createdAt: new Date('2021-08-17T07:51:25.56Z'),
    updatedAt: new Date('2021-08-17T07:51:25.56Z'),
  },
  fields: { location: null, locationList: null, locationAdminOnly: null },
};

export const MIGRATIONS_ENTITY_CREATE: Readonly<AdminEntityCreate<AdminMigrationEntity>> = {
  info: { name: 'MigrationEntity name', type: 'MigrationEntity', authKey: 'none' },
  fields: {},
};

export const REFERENCES_CREATE: Readonly<AdminEntityCreate<AdminReferences>> = {
  info: {
    type: 'References',
    name: 'References name',
    authKey: 'none',
  },
  fields: {},
};

export const REFERENCES_ADMIN_ENTITY: Readonly<AdminReferences> = {
  id: 'REPLACE',
  info: {
    type: 'References',
    name: 'References name',
    version: 0,
    authKey: 'none',
    status: AdminEntityStatus.draft,
    valid: true,
    validPublished: null,
    createdAt: new Date('2021-08-17T07:51:25.56Z'),
    updatedAt: new Date('2021-08-17T07:51:25.56Z'),
  },
  fields: { any: null, anyList: null, anyAdminOnly: null, titleOnly: null },
};

export const RICH_TEXTS_CREATE: Readonly<AdminEntityCreate<AdminRichTexts>> = {
  info: {
    type: 'RichTexts',
    name: 'RichTexts name',
    authKey: 'none',
  },
  fields: {},
};

export const RICH_TEXTS_ADMIN_ENTITY: Readonly<AdminRichTexts> = {
  id: 'REPLACE',
  info: {
    type: 'RichTexts',
    name: 'RichTexts name',
    version: 0,
    authKey: 'none',
    status: AdminEntityStatus.draft,
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

export const STRINGS_CREATE: Readonly<AdminEntityCreate<AdminStrings>> = {
  info: {
    type: 'Strings',
    name: 'Strings name',
    authKey: 'none',
  },
  fields: { multiline: 'Hello\nWorld' },
};

export const STRINGS_ADMIN_ENTITY: Readonly<AdminStrings> = {
  id: 'REPLACE',
  info: {
    type: 'Strings',
    name: 'Strings name',
    version: 0,
    authKey: 'none',
    status: AdminEntityStatus.draft,
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

export const SUBJECT_ONLY_CREATE: Readonly<AdminEntityCreate<AdminSubjectOnly>> = {
  info: {
    type: 'SubjectOnly',
    name: 'SubjectOnly name',
    authKey: 'subject',
  },
  fields: { message: 'Message' },
};

export const SUBJECT_ONLY_UPSERT: Readonly<AdminEntityUpsert<AdminSubjectOnly>> = {
  id: 'REPLACE',
  ...SUBJECT_ONLY_CREATE,
};

export const SUBJECT_ONLY_ADMIN_ENTITY: Readonly<AdminSubjectOnly> = {
  id: 'REPLACE',
  info: {
    type: 'SubjectOnly',
    name: 'SubjectOnly name',
    version: 0,
    authKey: 'subject',
    status: AdminEntityStatus.draft,
    valid: true,
    validPublished: null,
    createdAt: new Date('2021-08-17T07:51:25.56Z'),
    updatedAt: new Date('2021-08-17T07:51:25.56Z'),
  },
  fields: { message: 'Message' },
};

export const TITLE_ONLY_CREATE: Readonly<AdminEntityCreate<AdminTitleOnly>> = {
  info: {
    type: 'TitleOnly',
    name: 'TitleOnly name',
    authKey: 'none',
  },
  fields: { title: 'Title' },
};

export const TITLE_ONLY_UPSERT: Readonly<AdminEntityUpsert<AdminTitleOnly>> = {
  id: 'REPLACE',
  ...TITLE_ONLY_CREATE,
};

export const TITLE_ONLY_ADMIN_ENTITY: Readonly<AdminTitleOnly> = {
  id: 'REPLACE',
  info: {
    type: 'TitleOnly',
    name: 'TitleOnly name',
    version: 0,
    authKey: 'none',
    status: AdminEntityStatus.draft,
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
    authKey: 'none',
    valid: true,
    createdAt: new Date('2021-08-17T07:51:25.56Z'),
  },
  fields: { title: 'Title' },
};

export const VALUE_ITEMS_CREATE: Readonly<AdminEntityCreate<AdminValueItems>> = {
  info: {
    type: 'ValueItems',
    name: 'ValueItems name',
    authKey: 'none',
  },
  fields: {},
};

export function adminToPublishedEntity<T extends AppAdminEntity>(
  schema: AdminSchema,
  entity: T,
): AppPublishedEntity {
  assertEquals(entity.info.status, AdminEntityStatus.published);
  const {
    id,
    info: { name, type, authKey, validPublished, createdAt },
    fields,
  } = entity;
  let publishedEntity: PublishedEntity = {
    id,
    info: {
      type,
      name,
      authKey,
      valid: validPublished ?? false,
      createdAt,
    },
    fields: fields as unknown as Record<string, unknown>,
  };
  publishedEntity = deepMapEntity(schema, publishedEntity, {
    mapField: (fieldSpec, value) => {
      if (fieldSpec.adminOnly) return undefined;
      return value;
    },
  });
  return publishedEntity as unknown as AppPublishedEntity;
}

interface DeepMapMapper {
  mapField: (
    fieldSpec: AdminFieldSpecification,
    value: Readonly<unknown> | null,
  ) => Readonly<unknown> | null | undefined;
}

//TODO prototype for a generic deep map function
//TODO remove adminOnly fields from value items
function deepMapEntity<T extends EntityLike>(
  schema: AdminSchema,
  entity: T,
  mapper: DeepMapMapper,
): T {
  const entityTypeSpec = schema.getEntityTypeSpecification(entity.info.type);
  assertIsDefined(entityTypeSpec);

  let changedFields = false;
  const newFields: Record<string, unknown> = {};
  for (const fieldSpec of entityTypeSpec.fields) {
    const value = entity.fields[fieldSpec.name] as Readonly<unknown>;
    const mappedValue = mapper.mapField(fieldSpec, value);
    if (mappedValue !== value) {
      changedFields = true;
    }

    // If undefined, delete the field.
    if (mappedValue !== undefined) {
      newFields[fieldSpec.name] = mappedValue;
    }
  }

  if (!changedFields) {
    return entity;
  }

  return { ...entity, fields: newFields };
}
