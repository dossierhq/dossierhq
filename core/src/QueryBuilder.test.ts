import QueryBuilder from './QueryBuilder';

test('Only original query', () => {
  const qb = new QueryBuilder('SELECT * FROM foo WHERE a = $1', ['first']);
  expect(qb.build()).toMatchInlineSnapshot(`
    Object {
      "query": "SELECT * FROM foo WHERE a = $1",
      "values": Array [
        "first",
      ],
    }
  `);
});

test('SELECT * FROM foo + WHERE a = $1', () => {
  const qb = new QueryBuilder('SELECT * FROM foo');
  qb.addQuery(`WHERE a = ${qb.addValue('first')}`);
  expect(qb.build()).toMatchInlineSnapshot(`
    Object {
      "query": "SELECT * FROM foo WHERE a = $1",
      "values": Array [
        "first",
      ],
    }
  `);
});

test('Trailing WHERE is removed', () => {
  const qb = new QueryBuilder('SELECT * FROM foo WHERE');
  expect(qb.build()).toMatchInlineSnapshot(`
    Object {
      "query": "SELECT * FROM foo",
      "values": Array [],
    }
  `);
});

test('Starting AND is removed when adding to trailing WHERE', () => {
  const qb = new QueryBuilder('SELECT * FROM foo WHERE');
  qb.addQuery('AND bar = 1');
  expect(qb.build()).toMatchInlineSnapshot(`
    Object {
      "query": "SELECT * FROM foo WHERE bar = 1",
      "values": Array [],
    }
  `);
});
