/* eslint-disable @typescript-eslint/ban-ts-comment */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  getArgumentValues,
  getNamedType,
  GraphQLUnionType,
  isCompositeType,
  Kind,
  type ASTNode,
  type FieldNode,
  type FragmentSpreadNode,
  type GraphQLCompositeType,
  type GraphQLField,
  type GraphQLInterfaceType,
  type GraphQLNamedType,
  type GraphQLObjectType,
  type GraphQLResolveInfo,
  type InlineFragmentNode,
  type NamedTypeNode,
  type SelectionNode,
} from 'graphql';

// From https://github.com/graphile/graphile-engine/blob/v4/packages/graphql-parse-resolve-info/src/index.ts
// Modified to not use 'assert' and 'debug' packages for browser compatibility
// Last updated 4.13.0, Feb 12, 2021
// License MIT

type FieldsByTypeName = Record<string, Record<string, ResolveTree>>;

export interface ResolveTree {
  name: string;
  alias: string;
  args: Record<string, unknown>;
  fieldsByTypeName: FieldsByTypeName;
}

const debug = (..._args: unknown[]) => {
  // do nothing
};

const DEBUG_ENABLED = false;

function getArgVal(resolveInfo: GraphQLResolveInfo, argument: any) {
  if (argument.kind === 'Variable') {
    return resolveInfo.variableValues[argument.name.value];
  } else if (argument.kind === 'BooleanValue') {
    return argument.value;
  }
}

function argNameIsIf(arg: any): boolean {
  return arg?.name ? arg.name.value === 'if' : false;
}

function skipField(resolveInfo: GraphQLResolveInfo, { directives = [] }: SelectionNode) {
  let skip = false;
  directives.forEach((directive) => {
    const directiveName = directive.name.value;
    if (Array.isArray(directive.arguments)) {
      const ifArgumentAst = directive.arguments.find(argNameIsIf);
      if (ifArgumentAst) {
        const argumentValueAst = ifArgumentAst.value;
        if (directiveName === 'skip') {
          skip = skip || getArgVal(resolveInfo, argumentValueAst);
        } else if (directiveName === 'include') {
          skip = skip || !getArgVal(resolveInfo, argumentValueAst);
        }
      }
    }
  });
  return skip;
}

// Originally based on https://github.com/tjmehta/graphql-parse-fields

interface ParseOptions {
  keepRoot?: boolean;
  deep?: boolean;
}

export function parseResolveInfo(
  resolveInfo: GraphQLResolveInfo,
  options: ParseOptions = {},
): ResolveTree | FieldsByTypeName | null | undefined {
  const fieldNodes: readonly FieldNode[] =
    // @ts-ignore Property 'fieldASTs' does not exist on type 'GraphQLResolveInfo'.
    resolveInfo.fieldNodes || resolveInfo.fieldASTs;

  const { parentType } = resolveInfo;
  if (!fieldNodes) {
    throw new Error('No fieldNodes provided!');
  }
  if (options.keepRoot == null) {
    options.keepRoot = false;
  }
  if (options.deep == null) {
    options.deep = true;
  }
  const tree = fieldTreeFromAST(fieldNodes, resolveInfo, undefined, options, parentType);
  if (!options.keepRoot) {
    const typeKey = firstKey(tree);
    if (!typeKey) {
      return null;
    }
    const fields = tree[typeKey];
    const fieldKey = firstKey(fields);
    if (!fieldKey) {
      return null;
    }
    return fields[fieldKey];
  }
  return tree;
}

function getFieldFromAST<TContext>(
  ast: ASTNode,
  parentType: GraphQLCompositeType,
): GraphQLField<GraphQLCompositeType, TContext> | undefined {
  if (ast.kind === 'Field') {
    const fieldNode: FieldNode = ast;
    const fieldName = fieldNode.name.value;
    if (!(parentType instanceof GraphQLUnionType)) {
      const type: GraphQLObjectType | GraphQLInterfaceType = parentType;
      return type.getFields()[fieldName];
    } else {
      // XXX: TODO: Handle GraphQLUnionType
    }
  }
  return undefined;
}

let iNum = 1;
function fieldTreeFromAST<T extends SelectionNode>(
  inASTs: readonly T[] | T,
  resolveInfo: GraphQLResolveInfo,
  initTree: FieldsByTypeName = {},
  options: ParseOptions = {},
  parentType: GraphQLCompositeType,
  depth = '',
): FieldsByTypeName {
  const instance = iNum++;
  if (DEBUG_ENABLED)
    debug("%s[%d] Entering fieldTreeFromAST with parent type '%s'", depth, instance, parentType);
  const { variableValues } = resolveInfo;
  const fragments = resolveInfo.fragments || {};
  const asts: readonly T[] = Array.isArray(inASTs) ? inASTs : [inASTs];
  if (!initTree[parentType.name]) {
    initTree[parentType.name] = {};
  }
  const outerDepth = depth;
  return asts.reduce((tree, selectionVal: SelectionNode, idx) => {
    const depth = DEBUG_ENABLED ? `${outerDepth}  ` : null;
    if (DEBUG_ENABLED)
      debug(
        '%s[%d] Processing AST %d of %d; kind = %s',
        depth,
        instance,
        idx + 1,
        asts.length,
        selectionVal.kind,
      );
    if (skipField(resolveInfo, selectionVal)) {
      if (DEBUG_ENABLED) debug('%s[%d] IGNORING due to directive', depth, instance);
    } else if (selectionVal.kind === Kind.FIELD) {
      const val: FieldNode = selectionVal;
      const name = val.name.value;
      const isReserved = name.startsWith('_') && name[1] === '_' && name !== '__id';
      if (isReserved) {
        if (DEBUG_ENABLED)
          debug("%s[%d] IGNORING because field '%s' is reserved", depth, instance, name);
      } else {
        const alias: string = val.alias?.value ? val.alias.value : name;
        if (DEBUG_ENABLED) debug("%s[%d] Field '%s' (alias = '%s')", depth, instance, name, alias);
        const field = getFieldFromAST(val, parentType);
        if (field == null) {
          return tree;
        }
        const fieldGqlTypeOrUndefined = getNamedType(field.type);
        if (!fieldGqlTypeOrUndefined) {
          return tree;
        }
        const fieldGqlType: GraphQLNamedType = fieldGqlTypeOrUndefined;
        const args =
          getArgumentValues(field as GraphQLField<unknown, unknown>, val, variableValues) || {};
        if (parentType.name && !tree[parentType.name][alias]) {
          const newTreeRoot: ResolveTree = {
            name,
            alias,
            args,
            fieldsByTypeName: isCompositeType(fieldGqlType)
              ? {
                  [fieldGqlType.name]: {},
                }
              : {},
          };
          tree[parentType.name][alias] = newTreeRoot;
        }
        const selectionSet = val.selectionSet;
        if (selectionSet != null && options.deep && isCompositeType(fieldGqlType)) {
          const newParentType: GraphQLCompositeType = fieldGqlType;
          if (DEBUG_ENABLED) debug('%s[%d] Recursing into subfields', depth, instance);
          fieldTreeFromAST(
            selectionSet.selections,
            resolveInfo,
            tree[parentType.name][alias].fieldsByTypeName,
            options,
            newParentType,
            `${depth}  `,
          );
        } else {
          // No fields to add
          if (DEBUG_ENABLED) debug('%s[%d] Exiting (no fields to add)', depth, instance);
        }
      }
    } else if (selectionVal.kind === 'FragmentSpread' && options.deep) {
      const val: FragmentSpreadNode = selectionVal;
      const name = val.name && val.name.value;
      if (DEBUG_ENABLED) debug("%s[%d] Fragment spread '%s'", depth, instance, name);
      const fragment = fragments[name];
      if (!fragment) {
        throw new Error('Fragment "' + name + '" not found in document.');
      }
      let fragmentType: GraphQLNamedType | null | undefined = parentType;
      if (fragment.typeCondition) {
        fragmentType = getType(resolveInfo, fragment.typeCondition);
      }
      if (fragmentType && isCompositeType(fragmentType)) {
        const newParentType: GraphQLCompositeType = fragmentType;
        fieldTreeFromAST(
          fragment.selectionSet.selections,
          resolveInfo,
          tree,
          options,
          newParentType,
          `${depth}  `,
        );
      }
    } else if (selectionVal.kind === 'InlineFragment' && options.deep) {
      const val: InlineFragmentNode = selectionVal;
      const fragment = val;
      let fragmentType: GraphQLNamedType | null | undefined = parentType;
      if (fragment.typeCondition) {
        fragmentType = getType(resolveInfo, fragment.typeCondition);
      }
      if (DEBUG_ENABLED)
        debug(
          "%s[%d] Inline fragment (parent = '%s', type = '%s')",
          depth,
          instance,
          parentType,
          fragmentType,
        );
      if (fragmentType && isCompositeType(fragmentType)) {
        const newParentType: GraphQLCompositeType = fragmentType;
        fieldTreeFromAST(
          fragment.selectionSet.selections,
          resolveInfo,
          tree,
          options,
          newParentType,
          `${depth}  `,
        );
      }
    } else {
      if (DEBUG_ENABLED)
        debug(
          "%s[%d] IGNORING because kind '%s' not understood",
          depth,
          instance,
          selectionVal.kind,
        );
    }
    // Ref: https://github.com/graphile/postgraphile/pull/342/files#diff-d6702ec9fed755c88b9d70b430fda4d8R148
    return tree;
  }, initTree);
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
function firstKey(obj: Record<string, unknown>) {
  for (const key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      return key;
    }
  }
}

function getType(resolveInfo: GraphQLResolveInfo, typeCondition: NamedTypeNode) {
  const { schema } = resolveInfo;
  const { kind, name } = typeCondition;
  if (kind === 'NamedType') {
    const typeName = name.value;
    return schema.getType(typeName);
  }
}
