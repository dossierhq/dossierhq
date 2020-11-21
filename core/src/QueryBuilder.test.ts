import QueryBuilder from './QueryBuilder';

test('Only original query', () => {
  const qb = new QueryBuilder('SELECT * FROM foo WHERE a = $1', ['first']);
  expect(qb.query).toBe('SELECT * FROM foo WHERE a = $1');
  expect(qb.values).toEqual(['first']);
});

test('SELECT * FROM foo + WHERE a = $1', () => {
  const qb = new QueryBuilder('SELECT * FROM foo');
  qb.addQuery(`WHERE a = ${qb.addValue('first')}`);
  expect(qb.query).toBe('SELECT * FROM foo WHERE a = $1');
  expect(qb.values).toEqual(['first']);
});
