import type { AdminQuery } from '@jonasb/datadata-core';
import { encodeQuery, decodeQuery } from './QueryUtils';

describe('encodeQuery()', () => {
  test('query with entityTypes and boundingBox', () => {
    const query: AdminQuery = {
      entityTypes: ['Foo', 'Bar'],
      boundingBox: { minLat: 1, maxLat: 2, minLng: 3, maxLng: 4 },
    };
    expect(encodeQuery({ query })).toMatchInlineSnapshot(
      `"query=%7B%22entityTypes%22%3A%5B%22Foo%22%2C%22Bar%22%5D%2C%22boundingBox%22%3A%7B%22minLat%22%3A1%2C%22maxLat%22%3A2%2C%22minLng%22%3A3%2C%22maxLng%22%3A4%7D%7D"`
    );
  });
});

describe('decodeQuery()', () => {
  test('query with entityTypes and boundingBox', () => {
    const query: AdminQuery = {
      entityTypes: ['Foo', 'Bar'],
      boundingBox: { minLat: 1, maxLat: 2, minLng: 3, maxLng: 4 },
    };
    expect(
      decodeQuery('query', {
        query:
          '%7B%22entityTypes%22%3A%5B%22Foo%22%2C%22Bar%22%5D%2C%22boundingBox%22%3A%7B%22minLat%22%3A1%2C%22maxLat%22%3A2%2C%22minLng%22%3A3%2C%22maxLng%22%3A4%7D%7D',
      })
    ).toEqual(query);
  });
});
