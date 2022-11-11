/** This is not a general purpose SQL query builder, please ensure that the resulting SQL is what you're after.
 *
 */
export class QueryBuilder<TValue = unknown> {
  #valueIndexPrefix: string;
  #query: string;
  #values: TValue[] = [];

  constructor(valueIndexPrefix: string, query: string, values?: TValue[]) {
    this.#valueIndexPrefix = valueIndexPrefix;
    this.#query = query;
    if (values) {
      this.#values.push(...values);
    }
  }

  build(): { text: string; values: TValue[] } {
    let text = this.#query;
    if (this.#query.endsWith('WHERE')) {
      text = text.slice(0, -'WHERE'.length).trimEnd();
    }
    return { text, values: this.#values };
  }

  addQuery(querySegment: string): void {
    let segmentToAdd = querySegment;
    if (this.#query.endsWith('WHERE') && segmentToAdd.startsWith('AND')) {
      segmentToAdd = segmentToAdd.slice('AND'.length).trimStart();
    }

    const currentEndsWithBracket = endsWithBracket(this.#query);
    const newStartsWithBracket = startsWithBracket(segmentToAdd);
    const currentEndsWithKeyword = endsWithKeyword(this.#query);
    const newStartsWithKeyword = startsWithKeyword(segmentToAdd);

    let separator = '';
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
    this.#query += separator + segmentToAdd;
  }

  addValue(value: TValue): string {
    this.#values.push(value);
    return this.#valueIndexPrefix + this.#values.length;
  }

  addValueOrDefault(value: TValue | null | undefined): string {
    if (value === null || value === undefined) {
      return 'DEFAULT';
    }
    return this.addValue(value);
  }
}

export class PostgresQueryBuilder extends QueryBuilder<unknown> {
  constructor(query: string, values?: unknown[]) {
    super('$', query, values);
  }
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
