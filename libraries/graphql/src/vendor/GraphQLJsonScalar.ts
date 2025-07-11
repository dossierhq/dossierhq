// Source: https://github.com/taion/graphql-type-json
// License: MIT
// Vendored since these was a clash with different graphql version when running tests (at least under vitest)
// Converted to TypeScript

import { GraphQLScalarType } from 'graphql';
import { Kind, print, type ObjectValueNode, type ValueNode } from 'graphql/language/index.js';

function ensureObject(value: unknown): object {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`JSONObject cannot represent non-object value: ${typeof value}`);
  }

  return value;
}

function parseObject(
  typeName: 'JSON' | 'JSONObject',
  ast: ObjectValueNode,
  variables: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const value = Object.create(null) as Record<string, unknown>;
  ast.fields.forEach((field) => {
    value[field.name.value] = parseLiteral(typeName, field.value, variables);
  });

  return value;
}

function parseLiteral(
  typeName: 'JSON' | 'JSONObject',
  ast: ValueNode,
  variables: Record<string, unknown> | null | undefined,
): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT:
      return parseObject(typeName, ast, variables);
    case Kind.LIST:
      return ast.values.map((n) => parseLiteral(typeName, n, variables));
    case Kind.NULL:
      return null;
    case Kind.VARIABLE:
      return variables ? variables[ast.name.value] : undefined;
    default:
      throw new TypeError(`${typeName} cannot represent value: ${print(ast)}`);
  }
}

export const GraphQLJSONObject: GraphQLScalarType<object, object> = new GraphQLScalarType<
  object,
  object
>({
  name: 'JSONObject',
  description:
    'The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).',
  specifiedByURL: 'http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf',
  serialize: ensureObject,
  parseValue: ensureObject,
  parseLiteral: (ast, variables) => {
    if (ast.kind !== Kind.OBJECT) {
      throw new TypeError(`JSONObject cannot represent non-object value: ${print(ast)}`);
    }

    return parseObject('JSONObject', ast, variables);
  },
});
