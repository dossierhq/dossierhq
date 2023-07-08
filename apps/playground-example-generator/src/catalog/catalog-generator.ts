import 'dotenv/config';
//
import {
  copyEntity,
  createRichTextEntityLinkNode,
  createRichTextEntityNode,
  createRichTextHeadingNode,
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
  createRichTextValueItemNode,
  type AdminEntityCreate,
  type RichText,
} from '@dossierhq/core';
import { faker } from '@faker-js/faker';
import { v5 as uuidv5 } from 'uuid';
import { listCloudinaryImages } from '../utils/cloudinary-repository.js';
import {
  createAdapterAndServer,
  createNewDatabase,
  optimizeAndCloseDatabase,
} from '../utils/shared-generator.js';
import type {
  AdminBooleansEntity,
  AdminCloudinaryImage,
  AdminEntitiesEntity,
  AdminLocationsEntity,
  AdminNestedValueItem,
  AdminNumbersEntity,
  AdminRichTextsEntity,
  AdminStringsEntity,
  AdminStringsValueItem,
  AdminValueItemsEntity,
  AppAdminClient,
} from './schema-types.js';
import { SCHEMA, SCHEMA_WITHOUT_VALIDATIONS } from './schema.js';

const UUID_NAMESPACE = 'fdf4e979-6f82-4d61-ab14-26c318cb6731';

const CODE_BLOCK = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'if',
            type: 'code-highlight',
            version: 1,
            highlightType: 'keyword',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ' ',
            type: 'code-highlight',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '(',
            type: 'code-highlight',
            version: 1,
            highlightType: 'punctuation',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'true',
            type: 'code-highlight',
            version: 1,
            highlightType: 'boolean',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ')',
            type: 'code-highlight',
            version: 1,
            highlightType: 'punctuation',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ' ',
            type: 'code-highlight',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '{',
            type: 'code-highlight',
            version: 1,
            highlightType: 'punctuation',
          },
          {
            type: 'linebreak',
            version: 1,
          },
          {
            detail: 2,
            format: 0,
            mode: 'normal',
            style: '',
            text: '\t',
            type: 'tab',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'console',
            type: 'code-highlight',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '.',
            type: 'code-highlight',
            version: 1,
            highlightType: 'punctuation',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'log',
            type: 'code-highlight',
            version: 1,
            highlightType: 'function',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '(',
            type: 'code-highlight',
            version: 1,
            highlightType: 'punctuation',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: "'Hello world'",
            type: 'code-highlight',
            version: 1,
            highlightType: 'string',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ')',
            type: 'code-highlight',
            version: 1,
            highlightType: 'punctuation',
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ';',
            type: 'code-highlight',
            version: 1,
            highlightType: 'punctuation',
          },
          {
            type: 'linebreak',
            version: 1,
          },
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '}',
            type: 'code-highlight',
            version: 1,
            highlightType: 'punctuation',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'code',
        version: 1,
        language: 'javascript',
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
} as unknown as RichText;

function id(name: string) {
  return uuidv5(name, UUID_NAMESPACE);
}

async function createBooleansEntities(adminClient: AppAdminClient) {
  const minimal: AdminEntityCreate<AdminBooleansEntity> = {
    info: { type: 'BooleansEntity', authKey: 'none', name: 'Booleans minimal' },
    fields: {},
  };
  const minimalPublish = copyEntity(minimal, { fields: { required: true } });

  const results = [
    adminClient.createEntity(copyEntity(minimal, { id: id('booleans-minimal') })),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('booleans-published-minimal'),
        info: { name: 'Booleans published minimal' },
      }),
      { publish: true },
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('booleans-filled'),
        info: { name: 'Booleans filled' },
        fields: { normal: false, list: [true, false, true] },
      }),
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('booleans-published-invalid'),
        info: { name: 'Booleans published invalid' },
        fields: { required: null },
      }),
      { publish: true },
    ),
  ];
  return await Promise.all(results.map((it) => it.then((it) => it.valueOrThrow().entity)));
}

async function createEntitiesEntities(
  adminClient: AppAdminClient,
  {
    booleansEntities,
    locationsEntities,
    numbersEntities,
    stringsEntities,
  }: {
    booleansEntities: AdminBooleansEntity[];
    locationsEntities: AdminLocationsEntity[];
    numbersEntities: AdminNumbersEntity[];
    stringsEntities: AdminStringsEntity[];
  },
) {
  const minimal: AdminEntityCreate<AdminEntitiesEntity> = {
    info: { type: 'EntitiesEntity', authKey: 'none', name: 'Entities minimal' },
    fields: {},
  };
  const minimalPublish = copyEntity(minimal, {
    fields: { required: stringsEntities.find((it) => it.info.status === 'published') },
  });

  const results = [
    adminClient.createEntity(copyEntity(minimal, { id: id('entities-minimal') })),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('entities-published-minimal'),
        info: { name: 'Entities published minimal' },
      }),
      { publish: true },
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('entities-filled'),
        info: { name: 'Entities filled' },
        fields: {
          normal: booleansEntities.at(-1),
          list: numbersEntities.slice(0, 2),
          stringsEntity: stringsEntities.at(-1),
          stringsEntityList: stringsEntities.slice(0, 2),
          stringsAndLocationsEntity: locationsEntities.at(-1),
          stringsAndLocationsEntityList: [locationsEntities[0], ...stringsEntities.slice(0, 2)],
        },
      }),
    ),

    adminClient.createEntity(
      copyEntity(minimal, {
        id: id('entities-invalid'),
        info: { name: 'Entities invalid' },
        fields: {
          stringsEntity: booleansEntities.at(-1),
          stringsEntityList: booleansEntities.slice(0, 2),
          stringsAndLocationsEntity: numbersEntities.at(-1),
          stringsAndLocationsEntityList: numbersEntities.slice(0, 2),
        },
      }),
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('entities-published-invalid'),
        info: { name: 'Entities published invalid' },
      }),
      { publish: true },
    ),
  ];
  return await Promise.all(results.map((it) => it.then((it) => it.valueOrThrow().entity)));
}

async function createLocationsEntities(adminClient: AppAdminClient) {
  const malmo = { lat: 55.60498, lng: 13.003822 };
  const london = { lat: 51.459952, lng: -0.011228 };

  const minimal: AdminEntityCreate<AdminLocationsEntity> = {
    info: { type: 'LocationsEntity', authKey: 'none', name: 'Locations minimal' },
    fields: {},
  };
  const minimalPublish = copyEntity(minimal, {
    fields: { required: malmo, requiredList: [london] },
  });

  const results = [
    adminClient.createEntity(copyEntity(minimal, { id: id('locations-minimal') })),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('locations-published-minimal'),
        info: { name: 'Locations published minimal' },
      }),
      { publish: true },
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('locations-filled'),
        info: { name: 'Locations filled' },
        fields: { normal: malmo, list: [malmo, london] },
      }),
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('locations-published-invalid'),
        info: { name: 'Locations published invalid' },
        fields: { required: null, requiredList: null },
      }),
      { publish: true },
    ),
  ];

  return await Promise.all(results.map((it) => it.then((it) => it.valueOrThrow().entity)));
}

async function createNumbersEntities(adminClient: AppAdminClient) {
  const minimal: AdminEntityCreate<AdminNumbersEntity> = {
    info: { type: 'NumbersEntity', authKey: 'none', name: 'Numbers minimal' },
    fields: {},
  };
  const minimalPublish = copyEntity(minimal, {
    fields: { required: 1.23, requiredList: [4.56, 7.89], requiredIntegerList: [1, 2, 3] },
  });

  const results = [
    adminClient.createEntity(copyEntity(minimal, { id: id('numbers-minimal') })),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('numbers-published-minimal'),
        info: { name: 'Numbers published minimal' },
      }),
      { publish: true },
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('numbers-filled'),
        info: { name: 'Numbers filled' },
        fields: {
          normal: 1.23,
          integer: 7,
          list: [8.9, 0.1],
        },
      }),
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('numbers-published-invalid'),
        info: { name: 'Numbers published invalid' },
        fields: { required: null, requiredList: null, requiredIntegerList: null },
      }),
      { publish: true },
    ),

    adminClient.createEntity(
      copyEntity(minimal, {
        id: id('numbers-invalid'),
        info: { name: 'Numbers invalid' },
        fields: { integer: 1.234, requiredIntegerList: [1.23, 4.56] },
      }),
    ),
  ];

  return await Promise.all(results.map((it) => it.then((it) => it.valueOrThrow().entity)));
}

async function createRichTextsEntities(
  adminClient: AppAdminClient,
  {
    numbersEntities,
    stringsEntities,
    cloudinaryImageValueItems,
  }: {
    booleansEntities: AdminBooleansEntity[];
    locationsEntities: AdminLocationsEntity[];
    numbersEntities: AdminNumbersEntity[];
    stringsEntities: AdminStringsEntity[];
    cloudinaryImageValueItems: AdminCloudinaryImage[];
  },
) {
  const minimal: AdminEntityCreate<AdminRichTextsEntity> = {
    info: { type: 'RichTextsEntity', authKey: 'none', name: 'RichTexts minimal' },
    fields: {},
  };
  const minimalPublish = copyEntity(minimal, {
    fields: {
      required: createRichTextRootNode([
        createRichTextParagraphNode([
          createRichTextTextNode('Hello '),
          createRichTextTextNode('World!', { format: ['bold'] }),
        ]),
      ]),
    },
  });

  const results = [
    adminClient.createEntity(copyEntity(minimal, { id: id('rich-texts-minimal') })),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('rich-texts-published-minimal'),
        info: { name: 'RichTexts published minimal' },
      }),
      { publish: true },
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('rich-texts-filled'),
        info: { name: 'RichTexts filled' },
        fields: {
          normal: createRichTextRootNode([
            createRichTextParagraphNode([
              createRichTextTextNode('Hello '),
              createRichTextTextNode('World!', { format: ['bold'] }),
            ]),
            createRichTextValueItemNode(faker.helpers.arrayElement(cloudinaryImageValueItems)),
          ]),
          minimal: createRichTextRootNode([
            createRichTextParagraphNode([
              createRichTextTextNode('Hello '),
              createRichTextTextNode('World!', { format: ['bold'] }),
            ]),
          ]),
          code: CODE_BLOCK,
          list: [
            createRichTextRootNode([
              createRichTextParagraphNode([createRichTextTextNode('First')]),
            ]),
            createRichTextRootNode([
              createRichTextParagraphNode([createRichTextTextNode('Second')]),
            ]),
          ],
          adminOnly: createRichTextRootNode([
            createRichTextParagraphNode([createRichTextTextNode('Admin only field.')]),
          ]),
          stringsEntity: createRichTextRootNode([
            createRichTextEntityNode(stringsEntities[1]),
            createRichTextParagraphNode([
              createRichTextTextNode('There is an strings entity above'),
            ]),
          ]),
          numbersEntityLink: createRichTextRootNode([
            createRichTextParagraphNode([
              createRichTextTextNode('Hello '),
              createRichTextEntityLinkNode(numbersEntities[0], [createRichTextTextNode('World!')]),
            ]),
          ]),
          nestedValueItem: createRichTextRootNode([
            createRichTextValueItemNode<AdminNestedValueItem>({
              type: 'NestedValueItem',
              text: 'root',
              child: { type: 'NestedValueItem', text: 'child', child: null },
            }),
            createRichTextParagraphNode([
              createRichTextTextNode('There is a nested value item above'),
            ]),
          ]),
        },
      }),
    ),

    adminClient.createEntity(
      copyEntity(minimal, {
        id: id('rich-texts-value-item-validation'),
        info: { name: 'RichTexts validation of value items' },
        fields: {
          normal: createRichTextRootNode([
            //TODO add draft entity node when we check it in the editor (currently checked on server only)
            createRichTextParagraphNode([
              createRichTextTextNode('Required fields are not allowed to be empty:'),
            ]),
            createRichTextValueItemNode<AdminStringsValueItem>({
              type: 'StringsValueItem',
              normal: null,
              list: null,
              required: null,
              matchPattern: null,
              requiredList: null,
              requiredListMatchPattern: null,
            }),
          ]),
          adminOnly: createRichTextRootNode([
            createRichTextParagraphNode([
              createRichTextTextNode(
                'Since this field is admin only it can contain references to unpublished entities',
              ),
            ]),
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            createRichTextEntityNode(numbersEntities.find((it) => it.info.status === 'draft')!),
            createRichTextParagraphNode([
              createRichTextTextNode(
                'We can also add value items with empty required fields, but not with invalid fields:',
              ),
            ]),
            createRichTextValueItemNode<AdminStringsValueItem>({
              type: 'StringsValueItem',
              normal: null,
              list: null,
              required: null,
              matchPattern: null,
              requiredList: null,
              requiredListMatchPattern: null,
            }),
          ]),
        },
      }),
    ),

    adminClient.createEntity(
      copyEntity(minimal, {
        id: id('rich-texts-invalid'),
        info: { name: 'RichTexts invalid' },
        fields: {
          minimal: createRichTextRootNode([
            createRichTextHeadingNode('h1', [createRichTextTextNode('Heading')]),
          ]),
          stringsEntity: createRichTextRootNode([
            createRichTextEntityNode(numbersEntities[0]),
            createRichTextHeadingNode('h1', [createRichTextTextNode('Heading')]),
          ]),
          numbersEntityLink: createRichTextRootNode([
            createRichTextEntityLinkNode(stringsEntities[0], [
              createRichTextTextNode('Link to string entity'),
            ]),
            createRichTextHeadingNode('h1', [createRichTextTextNode('Heading')]),
          ]),
          nestedValueItem: createRichTextRootNode([
            createRichTextValueItemNode<AdminCloudinaryImage>(cloudinaryImageValueItems[0]),
            createRichTextHeadingNode('h1', [createRichTextTextNode('Heading')]),
          ]),
        },
      }),
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('rich-texts-published-invalid'),
        info: { name: 'RichTexts published invalid' },
        fields: {
          required: null,
        },
      }),
      { publish: true },
    ),
  ];
  return await Promise.all(results.map((it) => it.then((it) => it.valueOrThrow().entity)));
}

async function createStringsEntities(adminClient: AppAdminClient) {
  const minimal: AdminEntityCreate<AdminStringsEntity> = {
    info: { type: 'StringsEntity', authKey: 'none', name: 'Strings minimal' },
    fields: {},
  };
  const minimalPublish = copyEntity(minimal, {
    fields: {
      required: 'Required',
      requiredList: ['one', 'two'],
      requiredListMatchPattern: ['foo', 'bar'],
    },
  });

  const results = [
    adminClient.createEntity(copyEntity(minimal, { id: id('strings-minimal') })),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('strings-published-minimal'),
        info: { name: 'Strings published minimal' },
      }),
      { publish: true },
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('strings-filled'),
        info: { name: 'Strings filled' },
        fields: {
          title: 'Strings filled',
          normal: 'Hello',
          multiline: 'Hello\nWorld',
          multilineList: ['Hello\nWorld', 'one\ntwo\nthree'],
          index: 'strings-filled',
          matchPattern: 'baz',
          values: 'bar',
          valuesList: ['foo', 'bar', 'baz'],
          list: ['uno', 'dos', 'tres'],
        },
      }),
    ),

    adminClient.createEntity(
      copyEntity(minimal, {
        id: id('strings-invalid'),
        info: { name: 'Strings invalid' },
        fields: {
          normal: 'Multi\nline',
          matchPattern: 'invalid string',
          values: 'invalid' as 'foo',
          valuesList: ['invalid' as 'foo', 'values' as 'foo'],
          requiredListMatchPattern: ['invalid string'],
        },
      }),
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('strings-published-invalid'),
        info: { name: 'Strings published invalid' },
        fields: {
          required: null,
          requiredList: null,
          requiredListMatchPattern: null,
        },
      }),
      { publish: true },
    ),
  ];

  return await Promise.all(results.map((it) => it.then((it) => it.valueOrThrow().entity)));
}

async function createValueItemsEntities(
  adminClient: AppAdminClient,
  {
    cloudinaryImageValueItems,
  }: {
    booleansEntities: AdminBooleansEntity[];
    locationsEntities: AdminLocationsEntity[];
    numbersEntities: AdminNumbersEntity[];
    stringsEntities: AdminStringsEntity[];
    cloudinaryImageValueItems: AdminCloudinaryImage[];
  },
) {
  const minimal: AdminEntityCreate<AdminValueItemsEntity> = {
    info: { type: 'ValueItemsEntity', authKey: 'none', name: 'ValueItems minimal' },
    fields: {},
  };
  const minimalPublish = copyEntity(minimal, {
    fields: {
      required: { type: 'NestedValueItem', text: 'Required', child: null },
      requiredList: [
        { type: 'NestedValueItem', text: 'First', child: null },
        { type: 'NestedValueItem', text: 'Second', child: null },
      ],
    },
  });

  const results = [
    adminClient.createEntity(copyEntity(minimal, { id: id('value-items-minimal') })),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('value-items-published-minimal'),
        info: { name: 'ValueItems published minimal' },
      }),
      { publish: true },
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('value-items-filled'),
        info: { name: 'ValueItems filled' },
        fields: {
          normal: { type: 'NestedValueItem', text: 'First', child: null },
          list: [
            { type: 'NestedValueItem', text: 'First', child: null },
            { type: 'NestedValueItem', text: 'Second', child: null },
          ],
          adminOnly: {
            type: 'StringsValueItem',
            normal: null,
            required: null,
            matchPattern: null,
            list: null,
            requiredList: null,
            requiredListMatchPattern: null,
          },
          cloudinaryImage: faker.helpers.arrayElement(cloudinaryImageValueItems),
        },
      }),
    ),

    adminClient.createEntity(
      copyEntity(minimal, {
        id: id('value-items-invalid'),
        info: { name: 'ValueItems invalid' },
        fields: {
          cloudinaryImage: {
            type: 'NestedValueItem',
            text: 'First',
            child: null,
          } as unknown as AdminCloudinaryImage,
        },
      }),
    ),

    adminClient.createEntity(
      copyEntity(minimalPublish, {
        id: id('value-items-published-invalid'),
        info: { name: 'ValueItems published invalid' },
        fields: {
          required: null,
          requiredList: null,
        },
      }),
      { publish: true },
    ),
  ];

  return await Promise.all(results.map((it) => it.then((it) => it.valueOrThrow().entity)));
}

async function createCloudinaryImageValueItems() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const cloudinaryImages = await listCloudinaryImages(process.env.CLOUDINARY_BLOG_FOLDER!);
  const images = cloudinaryImages.map<AdminCloudinaryImage>((image) => ({
    type: 'CloudinaryImage',
    publicId: image.public_id,
    width: image.width,
    height: image.height,
    alt: null,
  }));

  return images;
}

async function main() {
  const database = await createNewDatabase('dist/catalog.sqlite');
  const { adminClient, server } = await createAdapterAndServer<AppAdminClient>(
    database,
    SCHEMA_WITHOUT_VALIDATIONS,
  );

  const cloudinaryImageValueItems = await createCloudinaryImageValueItems();

  const booleansEntities = await createBooleansEntities(adminClient);
  const locationsEntities = await createLocationsEntities(adminClient);
  const numbersEntities = await createNumbersEntities(adminClient);
  const stringsEntities = await createStringsEntities(adminClient);

  await createEntitiesEntities(adminClient, {
    booleansEntities,
    locationsEntities,
    numbersEntities,
    stringsEntities,
  });
  await createRichTextsEntities(adminClient, {
    booleansEntities,
    locationsEntities,
    numbersEntities,
    stringsEntities,
    cloudinaryImageValueItems,
  });
  await createValueItemsEntities(adminClient, {
    booleansEntities,
    locationsEntities,
    numbersEntities,
    stringsEntities,
    cloudinaryImageValueItems,
  });

  (await adminClient.updateSchemaSpecification(SCHEMA)).throwIfError();

  await optimizeAndCloseDatabase(server);
}

main().catch((error) => {
  console.error(error);
  console.error((error as Error).stack);
});
