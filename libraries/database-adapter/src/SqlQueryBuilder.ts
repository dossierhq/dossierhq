export const DEFAULT = Symbol('DEFAULT');

type InputValue<TValue> = TValue | typeof DEFAULT;

type SqlTemplateTag<TValue> = (
  strings: TemplateStringsArray,
  ...args: InputValue<TValue>[]
) => void;

interface Query<TValue> {
  text: string;
  values: TValue[];
}

interface SqlQueryBuilder<TValue> {
  sql: SqlTemplateTag<TValue>;
  query: Query<TValue>;
}

interface DialectConfig {
  indexPrefix: string;
}

function createSqlQuery<TValue>(config: DialectConfig): SqlQueryBuilder<TValue> {
  const query: { text: string; values: TValue[] } = { text: '', values: [] };
  const sql: SqlTemplateTag<TValue> = (strings, ...args) => {
    for (let i = 0; i < strings.length; i++) {
      if (i > 0) {
        addValue(config, query, args[i - 1]);
      }
      addText(query, strings[i]);
    }
  };
  return { sql, query };
}

function addValue<TValue>(config: DialectConfig, query: Query<TValue>, value: InputValue<TValue>) {
  if (value === DEFAULT) {
    query.text += 'DEFAULT';
  } else {
    query.values.push(value);
    query.text += `${config.indexPrefix}${query.values.length}`; // 1-based index
  }
}

function addText(query: Query<unknown>, text: string) {
  query.text += text;
}

// POSTGRES

export function createPostgresSqlQuery() {
  return createSqlQuery<unknown>({ indexPrefix: '$' });
}

// SQLITE

type SqliteColumnValue = number | string | Uint8Array | null;

export function createSqliteSqlQuery() {
  return createSqlQuery<SqliteColumnValue>({ indexPrefix: '?' });
}
