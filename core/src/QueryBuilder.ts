function isUpperCase(s: string) {
  return s === s.toUpperCase();
}

/** This is not a general purpose SQL query builder, please ensure that the resulting SQL is what you're after.
 *
 */
export default class QueryBuilder {
  query: string;
  values: unknown[] = [];
  constructor(query: string, values?: unknown[]) {
    this.query = query;
    if (values) {
      this.values.push(...values);
    }
  }

  build(): { query: string; values: unknown[] } {
    return { query: this.query, values: this.values };
  }

  addQuery(query: string): void {
    const isKeyword = isUpperCase(query[0]);
    const separator = isKeyword ? ' ' : ', ';
    this.query += separator + query;
  }

  addValue(value: unknown): string {
    this.values.push(value);
    return '$' + this.values.length;
  }
}
