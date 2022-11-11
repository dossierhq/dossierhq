import { describe, expect, test } from 'vitest';
import { PostgresQueryBuilder } from './QueryBuilder.js';

describe('PostgresQueryBuilder', () => {
  test('Only original query', () => {
    const qb = new PostgresQueryBuilder('SELECT * FROM foo WHERE a = $1', ['first']);
    expect(qb.build()).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo WHERE a = $1",
        "values": [
          "first",
        ],
      }
    `);
  });

  test('SELECT * FROM foo + WHERE a = $1', () => {
    const qb = new PostgresQueryBuilder('SELECT * FROM foo');
    qb.addQuery(`WHERE a = ${qb.addValue('first')}`);
    expect(qb.build()).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo WHERE a = $1",
        "values": [
          "first",
        ],
      }
    `);
  });

  test('Trailing WHERE is removed', () => {
    const qb = new PostgresQueryBuilder('SELECT * FROM foo WHERE');
    expect(qb.build()).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo",
        "values": [],
      }
    `);
  });

  test('Starting AND is removed when adding to trailing WHERE', () => {
    const qb = new PostgresQueryBuilder('SELECT * FROM foo WHERE');
    qb.addQuery('AND bar = 1');
    expect(qb.build()).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo WHERE bar = 1",
        "values": [],
      }
    `);
  });

  test('Insert multiple values', () => {
    const qb = new PostgresQueryBuilder('INSERT INTO foo (a) VALUES');
    qb.addQuery(`(${qb.addValue(1)})`);
    qb.addQuery(`(${qb.addValue(2)})`);
    qb.addQuery(`(${qb.addValue(3)})`);
    expect(qb.build()).toMatchInlineSnapshot(`
      {
        "text": "INSERT INTO foo (a) VALUES ($1), ($2), ($3)",
        "values": [
          1,
          2,
          3,
        ],
      }
    `);
  });

  test('Insert multiple values in one ()', () => {
    const qb = new PostgresQueryBuilder('INSERT INTO foo (a, b, c) VALUES (');
    qb.addQuery(qb.addValue(1));
    qb.addQuery(qb.addValue(2));
    qb.addQuery(qb.addValue(3));
    qb.addQuery(')');
    expect(qb.build()).toMatchInlineSnapshot(`
      {
        "text": "INSERT INTO foo (a, b, c) VALUES ($1, $2, $3)",
        "values": [
          1,
          2,
          3,
        ],
      }
    `);
  });

  test('Insert default value', () => {
    const qb = new PostgresQueryBuilder('INSERT INTO foo (a) VALUES');
    qb.addQuery(`(${qb.addValueOrDefault(null)})`);
    expect(qb.build()).toMatchInlineSnapshot(`
      {
        "text": "INSERT INTO foo (a) VALUES (DEFAULT)",
        "values": [],
      }
    `);
  });
});
