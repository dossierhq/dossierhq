import {
  GraphQLEnumType,
  isEnumType,
  isInputType,
  isInterfaceType,
  isOutputType,
  type GraphQLEnumValueConfigMap,
  type GraphQLInputType,
  type GraphQLInterfaceType,
  type GraphQLNamedType,
  type GraphQLOutputType,
} from 'graphql';
import { toAdminTypeName, toAdminComponentInputTypeName, toEnumName } from './NameGenerator.js';

export class TypeRepository {
  #types: GraphQLNamedType[] = [];

  getTypes() {
    return this.#types;
  }

  addType(type: GraphQLNamedType): void {
    if (this.#types.find((it) => it.name === type.name)) {
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

    const enumName = toEnumName(filteredNames, isAdmin);
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
      return this.getOutputType(toAdminTypeName('Component', isAdmin));
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

    return this.getInputType(toAdminComponentInputTypeName(uniqueNames[0]));
  }
}
