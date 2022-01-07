export const DEFAULT = Symbol('DEFAULT');

const ValueReferenceSymbol = Symbol('ValueReference');

interface ValueReference {
  marker: typeof ValueReferenceSymbol;
  index: number;
}

type InputValue<TValue> = TValue | typeof DEFAULT | ValueReference;

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
  addValue: (value: TValue) => ValueReference;
}

interface DialectConfig {
  indexPrefix: string;
}

function createSqlQuery<TValue>(config: DialectConfig): SqlQueryBuilder<TValue> {
  const query: { text: string; values: TValue[] } = { text: '', values: [] };
  const sql: SqlTemplateTag<TValue> = (strings, ...args) => {
    for (let i = 0; i < strings.length; i++) {
      if (i > 0) {
        addValueToQuery(config, query, args[i - 1]);
      }
      addTextToQuery(query, strings[i]);
    }
  };

  const addValue = (value: TValue) => addValueReference(query, value);

  return { sql, query, addValue };
}

function addValueReference<TValue>(query: Query<TValue>, value: TValue): ValueReference {
  query.values.push(value);
  return { marker: ValueReferenceSymbol, index: query.values.length };
}

function addValueToQuery<TValue>(
  config: DialectConfig,
  query: Query<TValue>,
  value: InputValue<TValue>
) {
  if (value === DEFAULT) {
    query.text += 'DEFAULT';
  } else if (
    typeof value === 'object' &&
    'marker' in value &&
    value.marker === ValueReferenceSymbol
  ) {
    query.text += `${config.indexPrefix}${value.index}`;
  } else {
    query.values.push(value as TValue);
    query.text += `${config.indexPrefix}${query.values.length}`; // 1-based index
  }
}

function addTextToQuery(query: Query<unknown>, text: string) {
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
