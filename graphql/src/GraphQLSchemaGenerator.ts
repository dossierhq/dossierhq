import { FieldType, isValueTypeField, notOk } from '@datadata/core';
import type {
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  AdminQuery,
  Entity,
  EntityTypeSpecification,
  ErrorType,
  Result,
  Schema,
  Value,
  ValueTypeSpecification,
} from '@datadata/core';
import type { SessionContext } from '@datadata/server';
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  isEnumType,
  isInputType,
  isInterfaceType,
  isOutputType,
} from 'graphql';
import type {
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLInputFieldConfigMap,
  GraphQLInputType,
  GraphQLNamedType,
  GraphQLOutputType,
  GraphQLSchemaConfig,
} from 'graphql';
import {
  loadAdminEntities,
  loadAdminEntity,
  loadAdminSearchEntities,
  loadEntities,
  loadEntity,
  loadVersionHistory,
} from './DataLoaders';
import * as Mutations from './Mutations';

export interface SessionGraphQLContext {
  context: Result<SessionContext, ErrorType.NotAuthenticated>;
}

function toAdminTypeName(name: string, isAdmin = true) {
  return isAdmin ? 'Admin' + name : name;
}

function toAdminCreateInputTypeName(name: string) {
  return `Admin${name}CreateInput`;
}

function toAdminUpdateInputTypeName(name: string) {
  return `Admin${name}UpdateInput`;
}

function toAdminValueInputTypeName(name: string) {
  return `Admin${name}Input`;
}

function fieldConfigWithArgs<TSource, TContext, TArgs>(
  config: GraphQLFieldConfig<TSource, TContext, TArgs>
): GraphQLFieldConfig<TSource, TContext> {
  return config as GraphQLFieldConfig<TSource, TContext>;
}

export class GraphQLSchemaGenerator<TContext extends SessionGraphQLContext> {
  #types: GraphQLNamedType[] = [];
  readonly schema: Schema;

  constructor(schema: Schema) {
    this.schema = schema;
  }

  addType(type: GraphQLNamedType): void {
    if (this.#types.find((x) => x.name === type.name)) {
      throw new Error(`Type with name ${type.name} already exists`);
    }
    this.#types.push(type);
  }

  getType(name: string): GraphQLNamedType {
    const type = this.#types.find((x) => x.name === name);
    if (!type) {
      throw new Error(`Type with name ${name} doesn't exist`);
    }
    return type;
  }

  getOutputType(name: string): GraphQLOutputType {
    const type = this.getType(name);
    if (isOutputType(type)) {
      return type;
    }
    throw new Error(`Type ${name} is not an output type`);
  }

  getEnumType(name: string): GraphQLEnumType {
    const type = this.getType(name);
    if (isEnumType(type)) {
      return type;
    }
    throw new Error(`Type ${name} is not an enum type`);
  }

  getInputType(name: string): GraphQLInputType {
    const type = this.getType(name);
    if (isInputType(type)) {
      return type;
    }
    throw new Error(`Type ${name} is not an input type`);
  }

  getInterface(name: string): GraphQLInterfaceType {
    const type = this.getType(name);
    if (isInterfaceType(type)) {
      return type;
    }
    throw new Error(`Type ${name} is not an interface`);
  }

  getInterfaces(...names: string[]): GraphQLInterfaceType[] {
    return names.map((name) => this.getInterface(name));
  }

  getOrCreateEntityUnion(isAdmin: boolean, names: string[]): GraphQLOutputType {
    if (names.length === 0) {
      return this.getOutputType(toAdminTypeName('Entity', isAdmin));
    }

    // Remove duplicates, sort alphabetically
    const filteredNames = [...new Set(names)];
    filteredNames.sort();

    if (filteredNames.length === 1) {
      return this.getOutputType(toAdminTypeName(filteredNames[0], isAdmin));
    }

    const enumName = `_${toAdminTypeName(filteredNames.join('Or'), isAdmin)}`;
    const existingEnum = this.#types.find((x) => x.name === enumName);
    if (existingEnum) {
      if (isOutputType(existingEnum)) {
        return existingEnum;
      }
      throw new Error(`Type ${enumName} is not an output type`);
    }

    const enumValues: GraphQLEnumValueConfigMap = {};
    filteredNames.forEach((name) => (enumValues[toAdminTypeName(name, isAdmin)] = {}));
    const enumType = new GraphQLEnumType({
      name: enumName,
      values: enumValues,
    });

    this.addType(enumType);
    return enumType;
  }

  getOrCreateValueUnion(isAdmin: boolean, names: string[]): GraphQLOutputType {
    if (names.length === 0) {
      return this.getOutputType(toAdminTypeName('Value', isAdmin));
    }

    // Remove duplicates, sort alphabetically
    const filteredNames = [...new Set(names)];
    filteredNames.sort();

    if (filteredNames.length === 1) {
      return this.getOutputType(toAdminTypeName(filteredNames[0], isAdmin));
    }

    const enumName = `_${toAdminTypeName(filteredNames.join('Or'), isAdmin)}`;
    const existingEnum = this.#types.find((x) => x.name === enumName);
    if (existingEnum) {
      if (isOutputType(existingEnum)) {
        return existingEnum;
      }
      throw new Error(`Type ${enumName} is not an output type`);
    }

    const enumValues: GraphQLEnumValueConfigMap = {};
    filteredNames.forEach((name) => (enumValues[toAdminTypeName(name, isAdmin)] = {}));
    const enumType = new GraphQLEnumType({
      name: enumName,
      values: enumValues,
    });

    this.addType(enumType);
    return enumType;
  }

  getValueInputType(names: string[]): GraphQLInputType | null {
    const uniqueNames = [...new Set(names)];
    if (uniqueNames.length !== 1) {
      return null; //There's no support for polymorphism on input types
    }

    return this.getInputType(toAdminValueInputTypeName(uniqueNames[0]));
  }

  addSupportingTypes(): void {
    // Node
    this.addType(
      new GraphQLInterfaceType({
        name: 'Node',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
      })
    );

    // PageInfo
    this.addType(
      new GraphQLObjectType({
        name: 'PageInfo',
        fields: {
          hasNextPage: { type: new GraphQLNonNull(GraphQLBoolean) },
          hasPreviousPage: { type: new GraphQLNonNull(GraphQLBoolean) },
          startCursor: { type: new GraphQLNonNull(GraphQLString) },
          endCursor: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );

    if (this.schema.getEntityTypeCount() === 0) {
      return;
    }

    // EntityType
    const entityTypeEnumValues: GraphQLEnumValueConfigMap = {};
    for (const entitySpec of this.schema.spec.entityTypes) {
      entityTypeEnumValues[entitySpec.name] = {};
    }
    this.addType(
      new GraphQLEnumType({
        name: 'EntityType',
        values: entityTypeEnumValues,
      })
    );

    // Entity
    this.addType(
      new GraphQLInterfaceType({
        name: 'Entity',
        interfaces: this.getInterfaces('Node'),
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          _name: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );

    if (this.schema.getValueTypeCount() > 0) {
      // ValueType
      const valueTypeEnumValues: GraphQLEnumValueConfigMap = {};
      for (const valueSpec of this.schema.spec.valueTypes) {
        valueTypeEnumValues[valueSpec.name] = {};
      }
      this.addType(
        new GraphQLEnumType({
          name: 'ValueType',
          values: valueTypeEnumValues,
        })
      );

      // Value
      this.addType(
        new GraphQLInterfaceType({
          name: 'Value',
          fields: {
            _type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          },
        })
      );
    }

    // Location
    this.addType(
      new GraphQLObjectType({
        name: 'Location',
        fields: {
          lat: { type: new GraphQLNonNull(GraphQLFloat) },
          lng: { type: new GraphQLNonNull(GraphQLFloat) },
        },
      })
    );

    // LocationInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'LocationInput',
        fields: {
          lat: { type: new GraphQLNonNull(GraphQLFloat) },
          lng: { type: new GraphQLNonNull(GraphQLFloat) },
        },
      })
    );

    // BoundingBoxInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'BoundingBoxInput',
        fields: {
          minLat: { type: new GraphQLNonNull(GraphQLFloat) },
          maxLat: { type: new GraphQLNonNull(GraphQLFloat) },
          minLng: { type: new GraphQLNonNull(GraphQLFloat) },
          maxLng: { type: new GraphQLNonNull(GraphQLFloat) },
        },
      })
    );
  }

  addEntityTypes(): void {
    for (const entitySpec of this.schema.spec.entityTypes) {
      this.addEntityType(entitySpec);
    }
  }

  addEntityType(entitySpec: EntityTypeSpecification): void {
    this.addType(
      new GraphQLObjectType<Entity, TContext>({
        name: entitySpec.name,
        interfaces: this.getInterfaces('Node', 'Entity'),
        isTypeOf: (source, _context, _info) => source._type === entitySpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<Entity, TContext> = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            _name: { type: new GraphQLNonNull(GraphQLString) },
          };
          this.addTypeSpecificationOutputFields(entitySpec, fields, false);
          return fields;
        },
      })
    );
  }

  addValueTypes(): void {
    for (const valueSpec of this.schema.spec.valueTypes) {
      this.addValueType(valueSpec);
    }
  }

  addValueType(valueSpec: ValueTypeSpecification): void {
    this.addType(
      new GraphQLObjectType<Value, TContext>({
        name: valueSpec.name,
        interfaces: this.getInterfaces('Value'),
        isTypeOf: (source, _context, _info) => source._type === valueSpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<Value, TContext> = {
            _type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          };
          this.addTypeSpecificationOutputFields(valueSpec, fields, false);
          return fields;
        },
      })
    );
  }

  addAdminSupportingTypes(): void {
    if (this.schema.getEntityTypeCount() === 0) {
      return;
    }
    // AdminEntity
    this.addType(
      new GraphQLInterfaceType({
        name: 'AdminEntity',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          _name: { type: new GraphQLNonNull(GraphQLString) },
          _type: { type: new GraphQLNonNull(this.getType('EntityType')) },
          _version: { type: new GraphQLNonNull(GraphQLInt) },
          _deleted: { type: new GraphQLNonNull(GraphQLBoolean) },
        },
      })
    );

    // AdminEntityEdge
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityEdge',
        fields: {
          node: { type: this.getOutputType('AdminEntity') },
          cursor: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );

    // AdminEntityConnection
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityConnection',
        fields: {
          pageInfo: { type: new GraphQLNonNull(this.getType('PageInfo')) },
          edges: { type: new GraphQLList(this.getType('AdminEntityEdge')) },
          totalCount: { type: new GraphQLNonNull(GraphQLInt) },
        },
      })
    );

    // AdminQueryInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminQueryInput',
        fields: {
          entityTypes: { type: new GraphQLList(this.getEnumType('EntityType')) },
          referencing: { type: GraphQLID },
          boundingBox: { type: this.getInputType('BoundingBoxInput') },
          order: { type: GraphQLString }, // TODO should be enum?
        },
      })
    );

    // AdminReferenceInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminReferenceInput',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
      })
    );

    // AdminReferenceVersionInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminReferenceVersionInput',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          version: { type: new GraphQLNonNull(GraphQLInt) },
        },
      })
    );

    if (this.schema.getValueTypeCount() > 0) {
      // AdminValue
      this.addType(
        new GraphQLInterfaceType({
          name: 'AdminValue',
          fields: {
            _type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          },
        })
      );
    }

    // AdminEntityVersionInfo
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityVersionInfo',
        fields: {
          version: { type: new GraphQLNonNull(GraphQLInt) },
          deleted: { type: new GraphQLNonNull(GraphQLBoolean) },
          published: { type: new GraphQLNonNull(GraphQLBoolean) },
          createdBy: { type: new GraphQLNonNull(GraphQLID) },
          createdAt: { type: new GraphQLNonNull(GraphQLString) }, // TODO handle dates
        },
      })
    );

    // AdminEntityHistory
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityHistory',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          type: { type: new GraphQLNonNull(this.getType('EntityType')) },
          name: { type: new GraphQLNonNull(GraphQLString) },
          versions: {
            type: new GraphQLNonNull(new GraphQLList(this.getType('AdminEntityVersionInfo'))),
          },
        },
      })
    );

    // AdminEntityPublishPayload
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityPublishPayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
      })
    );
  }

  addAdminEntityTypes(): void {
    for (const entitySpec of this.schema.spec.entityTypes) {
      this.addAdminEntityType(entitySpec);
    }
  }

  addAdminEntityType(entitySpec: EntityTypeSpecification): void {
    this.addType(
      new GraphQLObjectType<AdminEntity, TContext>({
        name: toAdminTypeName(entitySpec.name),
        interfaces: this.getInterfaces(toAdminTypeName('Entity')),
        isTypeOf: (source, _context, _info) => source._type === entitySpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<AdminEntity, TContext> = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            _type: { type: new GraphQLNonNull(this.getType('EntityType')) },
            _name: { type: new GraphQLNonNull(GraphQLString) },
            _version: { type: new GraphQLNonNull(GraphQLInt) },
            _deleted: { type: new GraphQLNonNull(GraphQLBoolean) },
          };
          this.addTypeSpecificationOutputFields(entitySpec, fields, true);
          return fields;
        },
      })
    );

    this.addType(
      new GraphQLInputObjectType({
        name: toAdminCreateInputTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            id: { type: GraphQLID },
            _type: { type: this.getEnumType('EntityType') },
            _name: { type: new GraphQLNonNull(GraphQLString) },
          };
          this.addTypeSpecificationInputFields(entitySpec, fields);
          return fields;
        },
      })
    );

    this.addType(
      new GraphQLInputObjectType({
        name: toAdminUpdateInputTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            _type: { type: this.getEnumType('EntityType') },
            _name: { type: GraphQLString },
          };
          this.addTypeSpecificationInputFields(entitySpec, fields);
          return fields;
        },
      })
    );
  }

  addAdminValueTypes(): void {
    for (const valueSpec of this.schema.spec.valueTypes) {
      this.addAdminValueType(valueSpec);
    }
  }

  addAdminValueType(valueSpec: ValueTypeSpecification): void {
    this.addType(
      new GraphQLObjectType<Value, TContext>({
        name: toAdminTypeName(valueSpec.name),
        interfaces: this.getInterfaces(toAdminTypeName('Value')),
        isTypeOf: (source, _context, _info) => source._type === valueSpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<Value, TContext> = {
            _type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          };
          this.addTypeSpecificationOutputFields(valueSpec, fields, true);
          return fields;
        },
      })
    );

    this.addType(
      new GraphQLInputObjectType({
        name: toAdminValueInputTypeName(valueSpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            _type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          };
          this.addTypeSpecificationInputFields(valueSpec, fields);
          return fields;
        },
      })
    );
  }

  addTypeSpecificationOutputFields<TSource>(
    typeSpec: EntityTypeSpecification | ValueTypeSpecification,
    fields: GraphQLFieldConfigMap<TSource, TContext>,
    isAdmin: boolean
  ): void {
    for (const fieldSpec of typeSpec.fields) {
      let fieldType;
      switch (fieldSpec.type) {
        case FieldType.EntityType:
          fieldType = this.getOrCreateEntityUnion(isAdmin, fieldSpec.entityTypes ?? []);
          break;
        case FieldType.Location:
          fieldType = this.getOutputType('Location');
          break;
        case FieldType.String:
          fieldType = GraphQLString;
          break;
        case FieldType.ValueType:
          fieldType = this.getOrCreateValueUnion(isAdmin, fieldSpec.valueTypes ?? []);
          break;
        default:
          throw new Error(`Unexpected type (${fieldSpec.type})`);
      }

      fields[fieldSpec.name] = {
        type: fieldSpec.list ? new GraphQLList(new GraphQLNonNull(fieldType)) : fieldType,
      };
    }
  }

  addTypeSpecificationInputFields(
    typeSpec: EntityTypeSpecification | ValueTypeSpecification,
    fields: GraphQLInputFieldConfigMap
  ): void {
    for (const fieldSpec of typeSpec.fields) {
      let fieldType;
      switch (fieldSpec.type) {
        case FieldType.EntityType:
          fieldType = this.getInputType('AdminReferenceInput');
          break;
        case FieldType.Location:
          fieldType = this.getInputType('LocationInput');
          break;
        case FieldType.String:
          fieldType = GraphQLString;
          break;
        case FieldType.ValueType: {
          fields[`${fieldSpec.name}Json`] = { type: GraphQLString };

          fieldType = this.getValueInputType(fieldSpec.valueTypes ?? []);
          break;
        }
        default:
          throw new Error(`Unexpected type (${fieldSpec.type})`);
      }

      if (fieldType) {
        fields[fieldSpec.name] = {
          type: fieldSpec.list ? new GraphQLList(new GraphQLNonNull(fieldType)) : fieldType,
        };
      }
    }
  }

  buildQueryFieldNode<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getInterface('Node'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (source, args, context, _info) => {
        return await loadEntity(context, args.id);
      },
    });
  }

  buildQueryFieldNodes<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { ids: string[] }>({
      type: new GraphQLList(this.getInterface('Node')),
      args: {
        ids: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID))) },
      },
      resolve: async (_source, args, context, _info) => {
        return await loadEntities(context, args.ids);
      },
    });
  }

  buildQueryFieldAdminEntity<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string; version: number | null }>({
      type: this.getInterface('AdminEntity'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        version: { type: GraphQLInt },
      },
      resolve: async (_source, args, context, _info) => {
        return await loadAdminEntity(context, args.id, args.version);
      },
    });
  }

  buildQueryFieldAdminEntities<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { ids: string[] }>({
      type: new GraphQLList(this.getInterface('AdminEntity')),
      args: {
        ids: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID))) },
      },
      resolve: async (source, args, context, _info) => {
        return await loadAdminEntities(context, args.ids);
      },
    });
  }

  buildQueryFieldAdminSearchEntities<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<
      TSource,
      TContext,
      {
        query?: AdminQuery;
        first?: number;
        after?: string;
        last?: number;
        before?: string;
      }
    >({
      type: this.getOutputType('AdminEntityConnection'),
      args: {
        query: { type: this.getInputType('AdminQueryInput') },
        first: { type: GraphQLInt },
        after: { type: GraphQLString },
        last: { type: GraphQLInt },
        before: { type: GraphQLString },
      },
      resolve: async (source, args, context, _info) => {
        const { query, first, after, last, before } = args;
        const paging = { first, after, last, before };
        return await loadAdminSearchEntities(context, query, paging);
      },
    });
  }

  buildQueryFieldAdminEntityHistory<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getOutputType('AdminEntityHistory'),
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (source, args, context, _info) => {
        const { id } = args;
        return await loadVersionHistory(context, id);
      },
    });
  }

  buildQueryType<TSource>(): GraphQLObjectType {
    const includeEntities = this.schema.getEntityTypeCount() > 0;

    return new GraphQLObjectType<TSource, TContext>({
      name: 'Query',
      fields: {
        node: this.buildQueryFieldNode(),
        nodes: this.buildQueryFieldNodes(),
        ...(includeEntities
          ? {
              adminEntity: this.buildQueryFieldAdminEntity(),
              adminEntities: this.buildQueryFieldAdminEntities(),
              adminEntityHistory: this.buildQueryFieldAdminEntityHistory(),
              adminSearchEntities: this.buildQueryFieldAdminSearchEntities(),
            }
          : {}),
      },
    });
  }

  buildMutationCreateEntity<TSource>(entityName: string): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { entity: AdminEntityCreate }>({
      type: this.getOutputType(toAdminTypeName(entityName)),
      args: {
        entity: { type: new GraphQLNonNull(this.getType(toAdminCreateInputTypeName(entityName))) },
      },
      resolve: async (_source, args, context, _info) => {
        const { entity } = args;
        if (entity._type && entity._type !== entityName) {
          throw notOk
            .BadRequest(`Specified type (entity._type=${entity._type}) should be ${entityName}`)
            .toError();
        }
        entity._type = entityName;
        this.resolveJsonFields(entity, entityName);
        return await Mutations.createEntity(context, entity);
      },
    });
  }

  buildMutationUpdateEntity<TSource>(entityName: string): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { entity: AdminEntityUpdate }>({
      type: this.getOutputType(toAdminTypeName(entityName)),
      args: {
        entity: { type: new GraphQLNonNull(this.getType(toAdminUpdateInputTypeName(entityName))) },
      },
      resolve: async (source, args, context, _info) => {
        const { entity } = args;
        if (entity._type && entity._type !== entityName) {
          throw notOk
            .BadRequest(`Specified type (entity._type=${entity._type}) should be ${entityName}`)
            .toError();
        }
        this.resolveJsonFields(entity, entityName);
        return await Mutations.updateEntity(context, entity);
      },
    });
  }

  resolveJsonFields(entity: AdminEntityCreate | AdminEntityUpdate, entityTypeName: string): void {
    const visitItem = (
      item: AdminEntityCreate | AdminEntityUpdate | Value,
      typeSpec: EntityTypeSpecification | ValueTypeSpecification,
      prefix: string,
      isEntity: boolean
    ) => {
      for (const fieldName of Object.keys(item)) {
        // Skip standard fields
        if (fieldName === '_type' || fieldName === '_name' || fieldName === 'id') {
          continue;
        }

        const fieldPrefix = `${prefix}.${fieldName}`;
        const fieldValue = item[fieldName];

        // Decode JSON fields
        if (fieldName.endsWith('Json')) {
          const fieldNameWithoutJson = fieldName.slice(0, -'Json'.length);

          let decodedValue;
          if (fieldValue === null) {
            decodedValue = null;
          } else if (fieldValue === undefined) {
            decodedValue = undefined;
          } else {
            if (typeof fieldValue !== 'string') {
              throw new Error(`${fieldPrefix}: Expected string, got ${typeof fieldValue}`);
            }
            try {
              decodedValue = JSON.parse(fieldValue);
            } catch (error) {
              throw new Error(`${fieldPrefix}: Failed parsing JSON: ${error.message}`);
            }
          }

          delete item[fieldName];
          item[fieldNameWithoutJson] = decodedValue;
          continue;
        }

        const fieldSpec = isEntity
          ? this.schema.getEntityFieldSpecification(typeSpec, fieldName)
          : this.schema.getValueFieldSpecification(typeSpec, fieldName);
        if (fieldSpec && isValueTypeField(fieldSpec, fieldValue) && fieldValue) {
          const type = fieldValue._type;
          const valueSpec = this.schema.getValueTypeSpecification(type);
          if (!valueSpec) {
            throw new Error(`${fieldPrefix}: No such type ${type}`);
          }

          visitItem(fieldValue, valueSpec, fieldPrefix, false);
        }
      }
    };

    const entitySpec = this.schema.getEntityTypeSpecification(entityTypeName);
    if (!entitySpec) {
      throw new Error(`No such entity type ${entityTypeName}`);
    }
    visitItem(entity, entitySpec, 'entity', true);
  }

  buildMutationDeleteEntity<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getOutputType('AdminEntity'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (source, args, context, _info) => {
        const { id } = args;
        return await Mutations.deleteEntity(context, id);
      },
    });
  }

  buildMutationPublishEntity<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string; version: number }>({
      type: this.getOutputType('AdminEntityPublishPayload'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        version: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: async (source, args, context, _info) => {
        const { id, version } = args;
        return await Mutations.publishEntity(context, id, version);
      },
    });
  }

  buildMutationPublishEntities<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { entities: { id: string; version: number }[] }>({
      type: new GraphQLList(new GraphQLNonNull(this.getOutputType('AdminEntityPublishPayload'))),
      args: {
        entities: {
          type: new GraphQLNonNull(
            new GraphQLList(new GraphQLNonNull(this.getInputType('AdminReferenceVersionInput')))
          ),
        },
      },
      resolve: async (source, args, context, _info) => {
        const { entities } = args;
        return await Mutations.publishEntities(context, entities);
      },
    });
  }

  buildMutationType<TSource>(): GraphQLObjectType | null {
    const includeEntities = this.schema.getEntityTypeCount() > 0;
    if (!includeEntities) {
      return null;
    }

    const fields: GraphQLFieldConfigMap<TSource, TContext> = {
      deleteEntity: this.buildMutationDeleteEntity(),
      publishEntity: this.buildMutationPublishEntity(),
      publishEntities: this.buildMutationPublishEntities(),
    };

    for (const entitySpec of this.schema.spec.entityTypes) {
      fields[`create${entitySpec.name}Entity`] = this.buildMutationCreateEntity(entitySpec.name);
      fields[`update${entitySpec.name}Entity`] = this.buildMutationUpdateEntity(entitySpec.name);
    }

    return new GraphQLObjectType<TSource, TContext>({
      name: 'Mutation',
      fields,
    });
  }

  buildSchemaConfig<TSource>(): GraphQLSchemaConfig {
    this.schema.validate().throwIfError();

    this.addSupportingTypes();
    this.addEntityTypes();
    this.addValueTypes();
    this.addAdminSupportingTypes();
    this.addAdminEntityTypes();
    this.addAdminValueTypes();

    const queryType = this.buildQueryType<TSource>();
    const mutationType = this.buildMutationType<TSource>();

    return { query: queryType, mutation: mutationType, types: this.#types };
  }

  buildSchema<TSource>(): GraphQLSchema {
    return new GraphQLSchema(this.buildSchemaConfig<TSource>());
  }
}
