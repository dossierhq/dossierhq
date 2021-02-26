import type { AdminEntity } from '@datadata/core';

export const foo1Id = 'fc66b4d7-61ff-44d4-8f68-cb7f526df046';
export const fooDeletedId = 'fb62be03-a0a9-4689-9987-bacee0e7692d';
export const bar1Id = 'cb228716-d3dd-444f-9a77-80443d436339';
export const bar2Id = 'eb5732e2-b931-492b-82f1-f8fdd464f0d2';

const entities: Array<AdminEntity[]> = [
  [
    {
      id: foo1Id,
      _type: 'Foo',
      _name: 'Foo 1',
      _version: 0,
      title: 'Hello',
      tags: ['one', 'two', 'three'],
      location: { lat: 55.60498, lng: 13.003822 },
      locations: [
        { lat: 55.60498, lng: 13.003822 },
        { lat: 56.381561, lng: 13.99286 },
      ],
      bar: { id: bar1Id },
      bars: [{ id: bar1Id }, { id: bar2Id }],
      annotatedBar: { _type: 'AnnotatedBar', annotation: 'Annotation', bar: { id: bar2Id } },
      annotatedBars: [
        { _type: 'AnnotatedBar', annotation: 'First', bar: { id: bar1Id } },
        { _type: 'AnnotatedBar', annotation: 'Second', bar: { id: bar2Id } },
      ],
    },
  ],
  [
    {
      id: fooDeletedId,
      _type: 'Foo',
      _name: 'Foo deleted',
      _version: 1,
      _deleted: true,
    },
    {
      id: fooDeletedId,
      _type: 'Foo',
      _name: 'Foo deleted',
      title: 'Hello',
      _version: 0,
    },
  ],
  [
    {
      id: bar1Id,
      _type: 'Bar',
      _name: 'Bar 1',
      _version: 0,
      title: 'Bar 1',
    },
  ],
  [
    {
      id: bar2Id,
      _type: 'Bar',
      _name: 'Bar 2',
      _version: 0,
      title: 'Bar 2',
    },
  ],
];

export function cloneFixture(): typeof entities {
  return JSON.parse(JSON.stringify(entities));
}

export function getEntityFixture(id: string): AdminEntity {
  const versions = entities.find((versions) => versions[0].id === id) as AdminEntity[];
  const maxVersion = versions.reduce((max, entity) => Math.max(max, entity._version), 0);
  return versions.find((entity) => entity._version === maxVersion) as AdminEntity;
}
