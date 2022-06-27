import {
  createRichTextEntityNode,
  createRichTextParagraphNode,
  createRichTextRootNode,
  createRichTextTextNode,
  createRichTextValueItemNode,
} from '@jonasb/datadata-core';

interface FixtureEntity {
  id: string;
  type: string;
  name: string;
  versions: InMemoryEntityVersion[];
  archived?: boolean;
  publishedVersion?: number | null;
}

interface InMemoryEntityVersion {
  [fieldName: string]: unknown;
}

export const foo1Id = 'fc66b4d7-61ff-44d4-8f68-cb7f526df046';
export const fooArchivedId = 'fb62be03-a0a9-4689-9987-bacee0e7692d';
export const bar1Id = 'cb228716-d3dd-444f-9a77-80443d436339';
export const bar2Id = 'eb5732e2-b931-492b-82f1-f8fdd464f0d2';
export const baz1Id = 'e6e928cc-e45f-452d-8bb0-73c2caad31c2';
export const qux1Id = '26e04f2c-8ede-43ac-a17d-99a32b8bb2a4';
export const userId1 = 'a10e49cd-2f4e-4249-b8ee-eaca8466939b';

export const entitiesFixture: FixtureEntity[] = [
  {
    id: bar1Id,
    type: 'Bar',
    name: 'Bar 1',
    publishedVersion: 0,
    versions: [
      {
        title: 'Bar 1',
      },
    ],
  },
  {
    id: bar2Id,
    type: 'Bar',
    name: 'Bar 2',
    publishedVersion: 0,
    versions: [
      {
        title: 'Bar 2',
      },
    ],
  },
  {
    id: foo1Id,
    type: 'Foo',
    name: 'Foo 1',
    publishedVersion: 0,
    versions: [
      {
        title: 'Hello',
        tags: ['one', 'two', 'three'],
        location: { lat: 55.60498, lng: 13.003822 },
        locations: [
          { lat: 55.60498, lng: 13.003822 },
          { lat: 56.381561, lng: 13.99286 },
        ],
        bar: { id: bar1Id },
        bars: [{ id: bar1Id }, { id: bar2Id }],
        body: createRichTextRootNode([
          createRichTextParagraphNode([createRichTextTextNode('Hello world')]),
        ]),
        annotatedBar: { type: 'AnnotatedBar', annotation: 'Annotation', bar: { id: bar2Id } },
        annotatedBars: [
          { type: 'AnnotatedBar', annotation: 'First', bar: { id: bar1Id } },
          { type: 'AnnotatedBar', annotation: 'Second', bar: { id: bar2Id } },
        ],
      },
    ],
  },
  {
    id: fooArchivedId,
    type: 'Foo',
    name: 'Foo archived',
    archived: true,
    versions: [
      {
        title: 'Hello',
      },
    ],
  },
  {
    id: baz1Id,
    type: 'Baz',
    name: 'Baz 1',
    versions: [
      {
        body: createRichTextRootNode([
          createRichTextParagraphNode([createRichTextTextNode('Hello world')]),
        ]),
        bodyBar: createRichTextRootNode([createRichTextEntityNode({ id: bar2Id })]),
        bodyNested: createRichTextRootNode([
          createRichTextValueItemNode({
            type: 'NestedValueItem',
            text: 'Hello nested',
            child: null,
          }),
        ]),
        bodyItalicOnly: createRichTextParagraphNode([
          createRichTextTextNode('Text with '),
          createRichTextTextNode('italic', { format: ['italic'] }),
        ]),
        bodyNoInline: createRichTextRootNode([
          createRichTextParagraphNode([createRichTextTextNode('Text with no inline styles')]),
        ]),
      },
    ],
  },
  {
    id: qux1Id,
    type: 'Qux',
    name: 'Qux 1',
    versions: [
      {
        title: 'Qux 1',
      },
    ],
  },
];
