import type { GraphQLResolveInfo } from 'graphql';
import { parseResolveInfo, type ResolveTree } from '../vendor/graphql-parse-resolve-info.js';

export function getRequestedChildFields(info: GraphQLResolveInfo): Set<string> {
  const fields = new Set<string>();

  const resolveTree = parseResolveInfo(info) as ResolveTree;
  for (const it of Object.values(resolveTree.fieldsByTypeName)) {
    const childFields = Object.values(it).map((it) => it.name);
    childFields.forEach((it) => fields.add(it));
  }

  return fields;
}
