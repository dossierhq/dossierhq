import {
  FieldType,
  isItemValueItem,
  isRichTextField,
  isValueTypeField,
  notOk,
} from '@jonasb/datadata-core';
import type {
  AdminClient,
  AdminEntity,
  AdminEntityCreate,
  AdminEntityUpdate,
  AdminQuery,
  Entity,
  EntityTypeSpecification,
  ErrorType,
  PublishedClient,
  Result,
  Schema,
  ValueItem,
  ValueTypeSpecification,
} from '@jonasb/datadata-core';
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
  loadPublishingHistory,
  loadVersionHistory,
} from './DataLoaders';
import * as Mutations from './Mutations';

export interface SessionGraphQLContext {
  schema: Result<Schema, ErrorType.NotAuthenticated>;
  adminClient: Result<AdminClient, ErrorType.NotAuthenticated>;
  publishedClient: Result<PublishedClient, ErrorType.NotAuthenticated>;
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

    // EntityInfo
    this.addType(
      new GraphQLObjectType({
        name: 'EntityInfo',
        fields: {
          name: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );

    // Entity
    this.addType(
      new GraphQLInterfaceType({
        name: 'Entity',
        interfaces: this.getInterfaces('Node'),
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          info: { type: new GraphQLNonNull(this.getType('EntityInfo')) },
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
            type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          },
        })
      );
    }

    // RichText
    this.addType(
      new GraphQLObjectType({
        name: 'RichText',
        fields: {
          blocksJson: { type: new GraphQLNonNull(GraphQLString) },
          entities: { type: new GraphQLList(this.getInterface('Entity')) },
        },
      })
    );

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
    const fieldsTypeName = `${entitySpec.name}Fields`;
    if (entitySpec.fields.length > 0) {
      this.addType(
        new GraphQLObjectType<Entity, TContext>({
          name: fieldsTypeName,
          fields: () => {
            const fields: GraphQLFieldConfigMap<Entity, TContext> = {};
            this.addTypeSpecificationOutputFields(entitySpec, fields, false);
            return fields;
          },
        })
      );
    }

    this.addType(
      new GraphQLObjectType<Entity, TContext>({
        name: entitySpec.name,
        interfaces: this.getInterfaces('Node', 'Entity'),
        isTypeOf: (source, _context, _info) => source.info.type === entitySpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<Entity, TContext> = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            info: { type: new GraphQLNonNull(this.getType('EntityInfo')) },
          };
          if (entitySpec.fields.length > 0) {
            fields.fields = { type: new GraphQLNonNull(this.getType(fieldsTypeName)) };
          }
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
      new GraphQLObjectType<ValueItem, TContext>({
        name: valueSpec.name,
        interfaces: this.getInterfaces('Value'),
        isTypeOf: (source, _context, _info) => source.type === valueSpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<ValueItem, TContext> = {
            type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
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
    // EntityPublishState
    this.addType(
      new GraphQLEnumType({
        name: 'EntityPublishState',
        values: {
          draft: {},
          published: {},
          modified: {},
          withdrawn: {},
          archived: {},
        },
      })
    );

    // AdminEntityInfo
    this.addType(
      new GraphQLObjectType({
        name: 'AdminEntityInfo',
        fields: {
          type: { type: new GraphQLNonNull(this.getType('EntityType')) },
          name: { type: new GraphQLNonNull(GraphQLString) },
          version: { type: new GraphQLNonNull(GraphQLInt) },
          publishingState: { type: new GraphQLNonNull(this.getType('EntityPublishState')) },
        },
      })
    );

    // AdminEntityCreateInfo
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminEntityCreateInfo',
        fields: {
          type: { type: this.getEnumType('EntityType') },
          name: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );

    // AdminEntityUpdateInfo
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminEntityUpdateInfo',
        fields: {
          type: { type: this.getEnumType('EntityType') },
          name: { type: GraphQLString },
          //TODO version
        },
      })
    );

    // AdminEntity
    this.addType(
      new GraphQLInterfaceType({
        name: 'AdminEntity',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          info: { type: new GraphQLNonNull(this.getType('AdminEntityInfo')) },
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
          text: { type: GraphQLString },
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

    // EntityVersionInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'EntityVersionInput',
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
            type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
          },
        })
      );
    }

    // AdminRichText
    this.addType(
      new GraphQLObjectType({
        name: 'AdminRichText',
        fields: {
          blocksJson: { type: new GraphQLNonNull(GraphQLString) },
          entities: { type: new GraphQLList(this.getInterface('AdminEntity')) },
        },
      })
    );

    // AdminRichTextInput
    this.addType(
      new GraphQLInputObjectType({
        name: 'AdminRichTextInput',
        fields: {
          blocksJson: { type: new GraphQLNonNull(GraphQLString) },
        },
      })
    );

    // EntityVersionInfo
    this.addType(
      new GraphQLObjectType({
        name: 'EntityVersionInfo',
        fields: {
          version: { type: new GraphQLNonNull(GraphQLInt) },
          published: { type: new GraphQLNonNull(GraphQLBoolean) },
          createdBy: { type: new GraphQLNonNull(GraphQLID) },
          createdAt: { type: new GraphQLNonNull(GraphQLString) }, // TODO handle dates
        },
      })
    );

    // EntityHistory
    this.addType(
      new GraphQLObjectType({
        name: 'EntityHistory',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          versions: {
            type: new GraphQLNonNull(new GraphQLList(this.getType('EntityVersionInfo'))),
          },
        },
      })
    );

    // PublishingEvent
    this.addType(
      new GraphQLObjectType({
        name: 'PublishingEvent',
        fields: {
          version: { type: GraphQLInt },
          publishedBy: { type: new GraphQLNonNull(GraphQLID) },
          publishedAt: { type: new GraphQLNonNull(GraphQLString) }, // TODO handle dates
        },
      })
    );

    // PublishingHistory
    this.addType(
      new GraphQLObjectType({
        name: 'PublishingHistory',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          events: {
            type: new GraphQLNonNull(new GraphQLList(this.getType('PublishingEvent'))),
          },
        },
      })
    );

    // EntityPublishPayload
    this.addType(
      new GraphQLObjectType({
        name: 'EntityPublishPayload',
        fields: {
          id: { type: new GraphQLNonNull(GraphQLID) },
          publishState: { type: new GraphQLNonNull(this.getEnumType('EntityPublishState')) },
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
    const fieldsName =
      entitySpec.fields.length > 0 ? `${toAdminTypeName(entitySpec.name)}Fields` : null;
    if (fieldsName) {
      this.addType(
        new GraphQLObjectType<AdminEntity['fields'], TContext>({
          name: fieldsName,
          fields: () => {
            const fields: GraphQLFieldConfigMap<AdminEntity['fields'], TContext> = {};
            this.addTypeSpecificationOutputFields(entitySpec, fields, true);
            return fields;
          },
        })
      );
    }

    this.addType(
      new GraphQLObjectType<AdminEntity, TContext>({
        name: toAdminTypeName(entitySpec.name),
        interfaces: this.getInterfaces(toAdminTypeName('Entity')),
        isTypeOf: (source, _context, _info) => source.info.type === entitySpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<AdminEntity, TContext> = {
            id: { type: new GraphQLNonNull(GraphQLID) },
            info: { type: new GraphQLNonNull(this.getType('AdminEntityInfo')) },
          };
          if (fieldsName) {
            fields.fields = { type: new GraphQLNonNull(this.getType(fieldsName)) };
          }
          return fields;
        },
      })
    );

    const inputFieldsName =
      entitySpec.fields.length > 0 ? `${toAdminTypeName(entitySpec.name)}FieldsInput` : null;
    if (inputFieldsName) {
      this.addType(
        new GraphQLInputObjectType({
          name: inputFieldsName,
          fields: () => {
            const fields: GraphQLInputFieldConfigMap = {};
            this.addTypeSpecificationInputFields(entitySpec, fields);
            return fields;
          },
        })
      );
    }

    this.addType(
      new GraphQLInputObjectType({
        name: toAdminCreateInputTypeName(entitySpec.name),
        fields: () => {
          const fields: GraphQLInputFieldConfigMap = {
            id: { type: GraphQLID },
            info: { type: new GraphQLNonNull(this.getType('AdminEntityCreateInfo')) },
          };
          if (inputFieldsName) {
            fields.fields = { type: this.getInputType(inputFieldsName) };
          }
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
            info: { type: this.getInputType('AdminEntityUpdateInfo') },
          };
          if (inputFieldsName) {
            fields.fields = { type: this.getInputType(inputFieldsName) };
          }
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
      new GraphQLObjectType<ValueItem, TContext>({
        name: toAdminTypeName(valueSpec.name),
        interfaces: this.getInterfaces(toAdminTypeName('Value')),
        isTypeOf: (source, _context, _info) => source.type === valueSpec.name,
        fields: () => {
          const fields: GraphQLFieldConfigMap<ValueItem, TContext> = {
            type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
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
            type: { type: new GraphQLNonNull(this.getEnumType('ValueType')) },
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
        case FieldType.RichText:
          fieldType = this.getOutputType(toAdminTypeName('RichText', isAdmin));
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
        case FieldType.RichText:
          fieldType = this.getInputType('AdminRichTextInput');
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
      resolve: async (_source, args, context, _info) => {
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
      resolve: async (_source, args, context, _info) => {
        const { query, first, after, last, before } = args;
        const paging = { first, after, last, before };
        return await loadAdminSearchEntities(context, query, paging);
      },
    });
  }

  buildQueryFieldEntityHistory<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getOutputType('EntityHistory'),
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (source, args, context, _info) => {
        const { id } = args;
        return await loadVersionHistory(context, id);
      },
    });
  }

  buildQueryFieldPublishingHistory<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getOutputType('PublishingHistory'),
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_source, args, context, _info) => {
        const { id } = args;
        return await loadPublishingHistory(context, id);
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
              adminSearchEntities: this.buildQueryFieldAdminSearchEntities(),
              entityHistory: this.buildQueryFieldEntityHistory(),
              publishingHistory: this.buildQueryFieldPublishingHistory(),
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
        if (entity.info.type && entity.info.type !== entityName) {
          throw notOk
            .BadRequest(
              `Specified type (entity.info.type=${entity.info.type}) should be ${entityName}`
            )
            .toError();
        }
        entity.info.type = entityName;
        this.resolveJsonInputFields(entity, entityName);
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
      resolve: async (_source, args, context, _info) => {
        const { entity } = args;
        if (entity.info?.type && entity.info.type !== entityName) {
          throw notOk
            .BadRequest(
              `Specified type (entity.info.type=${entity.info.type}) should be ${entityName}`
            )
            .toError();
        }
        this.resolveJsonInputFields(entity, entityName);
        return await Mutations.updateEntity(context, entity);
      },
    });
  }

  resolveJsonInputFields(
    entity: AdminEntityCreate | AdminEntityUpdate,
    entityTypeName: string
  ): void {
    const visitItem = (
      item: AdminEntityCreate | AdminEntityUpdate | ValueItem,
      typeSpec: EntityTypeSpecification | ValueTypeSpecification,
      prefix: string,
      isEntity: boolean
    ) => {
      const isValueItem = isItemValueItem(item);
      //TODO duplication of isItemValueItem(item) is not needed in next version of typescript
      const fields = isItemValueItem(item) ? item : item.fields ?? {};
      for (const fieldName of Object.keys(fields)) {
        // Skip standard fields
        if (isValueItem && fieldName === 'type') {
          continue;
        }
        const fieldPrefix = isValueItem
          ? `${prefix}.${fieldName}`
          : `${prefix}.fields.${fieldName}`;
        const fieldValue = fields[fieldName];

        // Decode JSON value item fields
        if (fieldName.endsWith('Json')) {
          const fieldNameWithoutJson = fieldName.slice(0, -'Json'.length);
          const decodedValue = this.decodeJsonInputField(fieldPrefix, fieldValue);

          delete fields[fieldName];
          fields[fieldNameWithoutJson] = decodedValue;
          continue;
        }

        const fieldSpec = isEntity
          ? this.schema.getEntityFieldSpecification(typeSpec, fieldName)
          : this.schema.getValueFieldSpecification(typeSpec, fieldName);

        // Decode RichText field
        if (fieldSpec && isRichTextField(fieldSpec, fieldValue) && fieldValue) {
          if (typeof fieldValue !== 'object') {
            throw new Error(`${fieldPrefix}: Expected object, got ${typeof fieldValue}`);
          }
          const { blocksJson, ...nonBlocks } = fieldValue as unknown as { blocksJson: string };
          fields[fieldName] = {
            ...nonBlocks,
            blocks: this.decodeJsonInputField(fieldPrefix + '.blocksJson', blocksJson),
          };
          continue;
        }

        // Traverse into value items
        if (fieldSpec && isValueTypeField(fieldSpec, fieldValue) && fieldValue) {
          const type = fieldValue.type;
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

  decodeJsonInputField(fieldPrefix: string, fieldValue: unknown): unknown {
    if (fieldValue === null) {
      return null;
    }
    if (fieldValue === undefined) {
      return undefined;
    }

    if (typeof fieldValue !== 'string') {
      throw new Error(`${fieldPrefix}: Expected string, got ${typeof fieldValue}`);
    }
    try {
      return JSON.parse(fieldValue);
    } catch (error) {
      throw new Error(`${fieldPrefix}: Failed parsing JSON: ${error.message}`);
    }
  }

  buildMutationPublishEntities<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { entities: { id: string; version: number }[] }>({
      type: new GraphQLList(new GraphQLNonNull(this.getOutputType('EntityPublishPayload'))),
      args: {
        entities: {
          type: new GraphQLNonNull(
            new GraphQLList(new GraphQLNonNull(this.getInputType('EntityVersionInput')))
          ),
        },
      },
      resolve: async (source, args, context, _info) => {
        const { entities } = args;
        return await Mutations.publishEntities(context, entities);
      },
    });
  }

  buildMutationUnpublishEntities<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { ids: string[] }>({
      type: new GraphQLList(new GraphQLNonNull(this.getOutputType('EntityPublishPayload'))),
      args: {
        ids: {
          type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID))),
        },
      },
      resolve: async (_source, args, context, _info) => {
        const { ids } = args;
        return await Mutations.unpublishEntities(context, ids);
      },
    });
  }

  buildMutationArchiveEntity<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getOutputType('EntityPublishPayload'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_source, args, context, _info) => {
        const { id } = args;
        return await Mutations.archiveEntity(context, id);
      },
    });
  }

  buildMutationUnarchiveEntity<TSource>(): GraphQLFieldConfig<TSource, TContext> {
    return fieldConfigWithArgs<TSource, TContext, { id: string }>({
      type: this.getOutputType('EntityPublishPayload'),
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve: async (_source, args, context, _info) => {
        const { id } = args;
        return await Mutations.unarchiveEntity(context, id);
      },
    });
  }

  buildMutationType<TSource>(): GraphQLObjectType | null {
    const includeEntities = this.schema.getEntityTypeCount() > 0;
    if (!includeEntities) {
      return null;
    }

    const fields: GraphQLFieldConfigMap<TSource, TContext> = {
      publishEntities: this.buildMutationPublishEntities(),
      unpublishEntities: this.buildMutationUnpublishEntities(),
      archiveEntity: this.buildMutationArchiveEntity(),
      unarchiveEntity: this.buildMutationUnarchiveEntity(),
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
