import { describe, expect, test } from 'vitest';
import { createPostgresSqlQuery, createSqliteSqlQuery, DEFAULT } from './SqlQueryBuilder.js';

describe('createPostgresSqlQuery', () => {
  test('one text', () => {
    const { sql, query } = createPostgresSqlQuery();
    sql`SELECT * FROM foo WHERE bar IS NULL`;

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo WHERE bar IS NULL",
        "values": [],
      }
    `);
  });

  test('one text with values', () => {
    const { sql, query } = createPostgresSqlQuery();
    sql`SELECT * FROM foo WHERE id = ${123} AND name = ${'Hello world'}`;

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo WHERE id = $1 AND name = $2",
        "values": [
          123,
          "Hello world",
        ],
      }
    `);
  });

  test('one text with DEFAULT', () => {
    const { sql, query } = createPostgresSqlQuery();
    sql`INSERT INTO foo (bar) VALUES (${DEFAULT})`;

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "INSERT INTO foo (bar) VALUES (DEFAULT)",
        "values": [],
      }
    `);
  });

  test('one text with addValue', () => {
    const { sql, query, addValue } = createPostgresSqlQuery();
    const reference = addValue('Hello');
    sql`INSERT INTO foo (bar, baz) VALUES (${reference}, ${reference})`;

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "INSERT INTO foo (bar, baz) VALUES ($1, $1)",
        "values": [
          "Hello",
        ],
      }
    `);
  });

  test('INSERT multiple values', () => {
    const { sql, query, addValue } = createPostgresSqlQuery();
    const reference = addValue('Hello');
    sql`INSERT INTO foo (bar, baz) VALUES`; // adds space after values
    sql`(${reference}, ${1})`; // adds ', ' between () ()
    sql`(${reference}, ${2})`;

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "INSERT INTO foo (bar, baz) VALUES ($1, $2), ($1, $3)",
        "values": [
          "Hello",
          1,
          2,
        ],
      }
    `);
  });

  test('AND is removed when coming after WHERE', () => {
    const { sql, query } = createPostgresSqlQuery();
    sql`SELECT * FROM foo WHERE`;
    if (String(true) === 'true') {
      sql`AND bar IS NULL`;
    }

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo WHERE bar IS NULL",
        "values": [],
      }
    `);
  });

  test('WHERE is removed when coming before ORDER', () => {
    const { sql, query } = createPostgresSqlQuery();
    sql`SELECT * FROM foo WHERE`;
    if (String(false) === 'true') {
      sql`AND bar IS NULL`;
    }
    sql`ORDER BY id`;

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo ORDER BY id",
        "values": [],
      }
    `);
  });

  test('removeTrailingSeparator() with trailing WHERE', () => {
    const { sql, query, removeTrailingWhere } = createPostgresSqlQuery();
    sql`SELECT * FROM foo WHERE`;
    removeTrailingWhere();
    expect(query).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo",
        "values": [],
      }
    `);
  });

  test('removeTrailingSeparator() without trailing WHERE', () => {
    const { sql, query, removeTrailingWhere } = createPostgresSqlQuery();
    sql`SELECT * FROM foo WHERE id = ${1}`;
    removeTrailingWhere();
    expect(query).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo WHERE id = $1",
        "values": [
          1,
        ],
      }
    `);
  });

  test('no separator is added before/after .', () => {
    const { sql, query } = createPostgresSqlQuery();
    sql`SELECT * FROM foo f WHERE f.`;
    sql`bar IS NULL OR f`;
    sql`.baz IS NULL`;

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo f WHERE f.bar IS NULL OR f.baz IS NULL",
        "values": [],
      }
    `);
  });

  test('comparison operator', () => {
    const { sql, query } = createPostgresSqlQuery();
    sql`SELECT * FROM foo WHERE bar`;
    sql`>=`;
    sql`${1 + 2}`;

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo WHERE bar >= $1",
        "values": [
          3,
        ],
      }
    `);
  });
});

describe('createSqliteSqlQuery', () => {
  test('one text', () => {
    const { sql, query } = createSqliteSqlQuery();
    sql`SELECT * FROM foo WHERE bar IS NULL`;

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo WHERE bar IS NULL",
        "values": [],
      }
    `);
  });

  test('one text with values', () => {
    const { sql, query } = createSqliteSqlQuery();
    sql`SELECT * FROM foo WHERE id = ${123} AND name = ${'Hello world'}`;

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo WHERE id = ?1 AND name = ?2",
        "values": [
          123,
          "Hello world",
        ],
      }
    `);
  });

  test('one text with DEFAULT', () => {
    const { sql, query } = createSqliteSqlQuery();
    sql`INSERT INTO foo (bar) VALUES (${DEFAULT})`;

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "INSERT INTO foo (bar) VALUES (DEFAULT)",
        "values": [],
      }
    `);
  });

  test('one text with addValue', () => {
    const { sql, query, addValue } = createSqliteSqlQuery();
    const reference = addValue('Hello');
    sql`INSERT INTO foo (bar, baz) VALUES (${reference}, ${reference})`;

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "INSERT INTO foo (bar, baz) VALUES (?1, ?1)",
        "values": [
          "Hello",
        ],
      }
    `);
  });

  test('add multiple values with addValueList', () => {
    const { sql, query, addValueList } = createSqliteSqlQuery();
    sql`SELECT * FROM foo WHERE bar IN ${addValueList([1, 2, 3])}`;

    expect(query).toMatchInlineSnapshot(`
      {
        "text": "SELECT * FROM foo WHERE bar IN (?1, ?2, ?3)",
        "values": [
          1,
          2,
          3,
        ],
      }
    `);
  });
});
