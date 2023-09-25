export const DEFAULT = Symbol('DEFAULT');

const ValueReferenceSymbol = Symbol('ValueReference');

const RawSqlSymbol = Symbol('RawSql');

interface ValueReference {
  marker: typeof ValueReferenceSymbol;
  index: number;
}

interface RawSql {
  marker: typeof RawSqlSymbol;
  sql: string;
}

type InputValue<TValue> = TValue | typeof DEFAULT | ValueReference | RawSql;

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
  removeTrailingWhere: () => void;
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

  const removeTrailingWhere = () => {
    if (query.text.endsWith('WHERE')) {
      query.text = query.text.slice(0, query.text.length - 'WHERE'.length).trimEnd();
    }
  };

  return { sql, query, addValue, removeTrailingWhere };
}

function createRawSql(sql: string): RawSql {
  return { marker: RawSqlSymbol, sql };
}

function addValueReference<TValue>(query: Query<TValue>, value: TValue): ValueReference {
  query.values.push(value);
  return { marker: ValueReferenceSymbol, index: query.values.length };
}

function addValueToQuery<TValue>(
  config: DialectConfig,
  query: Query<TValue>,
  value: InputValue<TValue>,
) {
  if (value === DEFAULT) {
    query.text += 'DEFAULT';
  } else if (
    typeof value === 'object' &&
    value &&
    'marker' in value &&
    value.marker === ValueReferenceSymbol
  ) {
    query.text += `${config.indexPrefix}${value.index}`;
  } else if (
    typeof value === 'object' &&
    value &&
    'marker' in value &&
    value.marker === RawSqlSymbol
  ) {
    query.text += value.sql;
  } else {
    query.values.push(value);
    query.text += `${config.indexPrefix}${query.values.length}`; // 1-based index
  }
}

function addTextToQuery(query: Query<unknown>, text: string, addSeparator: boolean) {
  let existingText = query.text;

  let textToAdd = text;
  if (existingText.endsWith('WHERE') && textToAdd.startsWith('AND')) {
    textToAdd = textToAdd.slice('AND'.length).trimStart();
  } else if (existingText.endsWith('WHERE') && textToAdd.startsWith('ORDER')) {
    existingText = existingText.slice(0, existingText.length - 'WHERE'.length).trimEnd();
  } else if (existingText.endsWith('VALUES') && textToAdd.startsWith(',')) {
    textToAdd = textToAdd.slice(','.length);
  }

  let separator = '';
  if (existingText && addSeparator) {
    //TODO simplify this
    const currentEndsWithPunctuation = endsWithPunctuation(existingText);
    const newStartsWithBracket = startsWithPunctuation(textToAdd);
    const currentEndsWithKeyword = endsWithKeyword(existingText);
    const newStartsWithKeyword = startsWithKeyword(textToAdd);
    const currentEndsWithOperator = endsWithOperator(existingText);
    const newStartsWithOperator = startsWithOperator(textToAdd);

    if (currentEndsWithPunctuation || newStartsWithBracket) {
      separator = '';
    } else if (currentEndsWithOperator || newStartsWithOperator) {
      separator = ' ';
    } else if (currentEndsWithKeyword && !newStartsWithKeyword) {
      separator = ' ';
    } else if (!currentEndsWithKeyword && !newStartsWithKeyword) {
      separator = ' ';
    } else if (!currentEndsWithKeyword && newStartsWithKeyword) {
      separator = ' ';
    } else if (currentEndsWithKeyword && newStartsWithKeyword) {
      separator = ' ';
    }
  }

  query.text = existingText + separator + textToAdd;
}

function startsWithPunctuation(query: string) {
  const firstChar = query[0];
  return firstChar === ')' || firstChar === ',' || firstChar === '.' || firstChar === ' ';
}

function endsWithPunctuation(query: string) {
  const lastChar = query[query.length - 1];
  return lastChar === '(' || lastChar === ',' || lastChar === '.' || lastChar === ' ';
}

function startsWithKeyword(query: string) {
  return !!query.match(/^[A-Z]+\w/);
}

function endsWithKeyword(query: string) {
  return !!query.match(/\w[A-Z]+$/);
}

function startsWithOperator(query: string) {
  return !!query.match(/^[=!<>]+/);
}

function endsWithOperator(query: string) {
  return !!query.match(/[=!<>]+$/);
}

// POSTGRES

export type PostgresQueryBuilder = SqlQueryBuilder<unknown>;

export type PostgresSqlTemplateTag = SqlTemplateTag<unknown>;

export function createPostgresSqlQuery(): PostgresQueryBuilder {
  return createSqlQuery<unknown>({ indexPrefix: '$' });
}

export function buildPostgresSqlQuery(callback: SqlQueryBuilderCallback<unknown>): Query<unknown> {
  const { query, ...builder } = createPostgresSqlQuery();
  callback(builder);
  return query;
}

// SQLITE

type SqliteColumnValue = number | string | Uint8Array | null;

export type SqliteSqlTemplateTag = SqlTemplateTag<SqliteColumnValue>;

export interface SqliteQueryBuilder extends SqlQueryBuilder<SqliteColumnValue> {
  addValueList: (values: SqliteColumnValue[]) => RawSql;
}

type SqliteQueryBuilderCallback = (builder: Omit<SqliteQueryBuilder, 'query'>) => void;

export function createSqliteSqlQuery(): SqliteQueryBuilder {
  const sqlBuilder = createSqlQuery<SqliteColumnValue>({ indexPrefix: '?' });

  const addValueList = (list: SqliteColumnValue[]) => {
    const values = list.map((it) => sqlBuilder.addValue(it));
    return createRawSql('(' + values.map((it) => `?${it.index}`).join(', ') + ')');
  };

  const sqliteBuilder: SqliteQueryBuilder = { ...sqlBuilder, addValueList };
  return sqliteBuilder;
}

export function buildSqliteSqlQuery(
  callback: SqliteQueryBuilderCallback,
): Query<SqliteColumnValue> {
  const { query, ...builder } = createSqliteSqlQuery();
  callback(builder);
  return query;
}
