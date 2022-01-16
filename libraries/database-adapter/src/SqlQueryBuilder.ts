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

type SqlQueryBuilderCallback<TValue> = (builder: Omit<SqlQueryBuilder<TValue>, 'query'>) => void;

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
      addTextToQuery(query, strings[i], i === 0);
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

function addTextToQuery(query: Query<unknown>, text: string, addSeparator: boolean) {
  let separator = '';
  if (query.text && addSeparator) {
    const currentEndsWithBracket = endsWithBracket(query.text);
    const newStartsWithBracket = startsWithBracket(text);
    const currentEndsWithKeyword = endsWithKeyword(query.text);
    const newStartsWithKeyword = startsWithKeyword(text);

    if (currentEndsWithBracket || newStartsWithBracket) {
      separator = '';
    } else if (currentEndsWithKeyword && !newStartsWithKeyword) {
      separator = ' ';
    } else if (!currentEndsWithKeyword && !newStartsWithKeyword) {
      separator = ', ';
    } else if (!currentEndsWithKeyword && newStartsWithKeyword) {
      separator = ' ';
    } else if (currentEndsWithKeyword && newStartsWithKeyword) {
      separator = ' ';
    }
  }

  query.text += separator + text;
}

function startsWithBracket(query: string) {
  return query.startsWith(')');
}

function endsWithBracket(query: string) {
  return query.endsWith('(');
}

function startsWithKeyword(query: string) {
  return !!query.match(/^[A-Z]+\w/);
}

function endsWithKeyword(query: string) {
  return !!query.match(/\w[A-Z]+$/);
}

// POSTGRES

export function createPostgresSqlQuery() {
  return createSqlQuery<unknown>({ indexPrefix: '$' });
}

export function buildPostgresSqlQuery(callback: SqlQueryBuilderCallback<unknown>): Query<unknown> {
  const { query, ...builder } = createPostgresSqlQuery();
  callback(builder);
  return query;
}

// SQLITE

type SqliteColumnValue = number | string | Uint8Array | null;

export function createSqliteSqlQuery() {
  return createSqlQuery<SqliteColumnValue>({ indexPrefix: '?' });
}

export function buildSqliteSqlQuery(
  callback: SqlQueryBuilderCallback<SqliteColumnValue>
): Query<SqliteColumnValue> {
  const { query, ...builder } = createSqliteSqlQuery();
  callback(builder);
  return query;
}
