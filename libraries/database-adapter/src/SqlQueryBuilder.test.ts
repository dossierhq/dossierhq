import { createPostgresSqlQuery, createSqliteSqlQuery, DEFAULT } from './SqlQueryBuilder';

describe('createPostgresSqlQuery', () => {
  test('one text', () => {
    const { sql, query } = createPostgresSqlQuery();
    sql`SELECT * FROM foo WHERE bar IS NULL`;

    expect(query).toMatchInlineSnapshot(`
      Object {
        "text": "SELECT * FROM foo WHERE bar IS NULL",
        "values": Array [],
      }
    `);
  });

  test('one text with values', () => {
    const { sql, query } = createPostgresSqlQuery();
    sql`SELECT * FROM foo WHERE id = ${123} AND name = ${'Hello world'}`;

    expect(query).toMatchInlineSnapshot(`
      Object {
        "text": "SELECT * FROM foo WHERE id = $1 AND name = $2",
        "values": Array [
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
      Object {
        "text": "INSERT INTO foo (bar) VALUES (DEFAULT)",
        "values": Array [],
      }
    `);
  });

  test('one text with addValue', () => {
    const { sql, query, addValue } = createPostgresSqlQuery();
    const reference = addValue('Hello');
    sql`INSERT INTO foo (bar, baz) VALUES (${reference}, ${reference})`;

    expect(query).toMatchInlineSnapshot(`
      Object {
        "text": "INSERT INTO foo (bar, baz) VALUES ($1, $1)",
        "values": Array [
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
      Object {
        "text": "INSERT INTO foo (bar, baz) VALUES ($1, $2), ($1, $3)",
        "values": Array [
          "Hello",
          1,
          2,
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
      Object {
        "text": "SELECT * FROM foo WHERE bar IS NULL",
        "values": Array [],
      }
    `);
  });

  test('one text with values', () => {
    const { sql, query } = createSqliteSqlQuery();
    sql`SELECT * FROM foo WHERE id = ${123} AND name = ${'Hello world'}`;

    expect(query).toMatchInlineSnapshot(`
      Object {
        "text": "SELECT * FROM foo WHERE id = ?1 AND name = ?2",
        "values": Array [
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
      Object {
        "text": "INSERT INTO foo (bar) VALUES (DEFAULT)",
        "values": Array [],
      }
    `);
  });

  test('one text with addValue', () => {
    const { sql, query, addValue } = createSqliteSqlQuery();
    const reference = addValue('Hello');
    sql`INSERT INTO foo (bar, baz) VALUES (${reference}, ${reference})`;

    expect(query).toMatchInlineSnapshot(`
      Object {
        "text": "INSERT INTO foo (bar, baz) VALUES (?1, ?1)",
        "values": Array [
          "Hello",
        ],
      }
    `);
  });
});
