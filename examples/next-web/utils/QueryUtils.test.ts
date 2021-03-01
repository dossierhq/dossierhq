import type { AdminQuery } from '@datadata/core';
import { encodeQuery, decodeQuery } from './QueryUtils';

describe('encodeQuery()', () => {
  test('query with entityTypes and boundingBox', () => {
    const query: AdminQuery = {
      entityTypes: ['Foo', 'Bar'],
      boundingBox: { bottomLeft: { lat: 1, lng: 2 }, topRight: { lat: 3, lng: 4 } },
    };
    expect(encodeQuery({ query })).toMatchInlineSnapshot(
      `"query=%7B%22entityTypes%22%3A%5B%22Foo%22%2C%22Bar%22%5D%2C%22boundingBox%22%3A%7B%22bottomLeft%22%3A%7B%22lat%22%3A1%2C%22lng%22%3A2%7D%2C%22topRight%22%3A%7B%22lat%22%3A3%2C%22lng%22%3A4%7D%7D%7D"`
    );
  });
});

describe('decodeQuery()', () => {
  test('query with entityTypes and boundingBox', () => {
    const query: AdminQuery = {
      entityTypes: ['Foo', 'Bar'],
      boundingBox: { bottomLeft: { lat: 1, lng: 2 }, topRight: { lat: 3, lng: 4 } },
    };
    expect(
      decodeQuery('query', {
        query:
          '%7B%22entityTypes%22%3A%5B%22Foo%22%2C%22Bar%22%5D%2C%22boundingBox%22%3A%7B%22bottomLeft%22%3A%7B%22lat%22%3A1%2C%22lng%22%3A2%7D%2C%22topRight%22%3A%7B%22lat%22%3A3%2C%22lng%22%3A4%7D%7D%7D',
      })
    ).toEqual(query);
  });
});
