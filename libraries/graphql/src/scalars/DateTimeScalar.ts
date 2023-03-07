import { GraphQLScalarType, Kind } from 'graphql';

export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  serialize(value: unknown) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    throw new TypeError('DateTime must be serialized from a Date.');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    throw new TypeError('DateTime must be represented as a string.');
  },
  parseValue(value: unknown) {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string') {
      return new Date(value);
    }
    throw new TypeError('DateTime must be represented as a Date or string.');
  },
});
