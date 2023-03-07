import type { Location } from '@dossierhq/core';
import { GraphQLScalarType } from 'graphql';
import type { ObjectValueNode } from 'graphql/language';
import { Kind } from 'graphql/language';

export const LocationScalar = new GraphQLScalarType({
  name: 'Location',
  description: 'Geographic location using EPSG:4326/WGS 84',
  serialize(value) {
    if (value === null) return null;
    assertLocation(value);
    return value;
  },
  parseValue(value) {
    if (value === null) return null;
    assertLocation(value);
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.OBJECT) {
      const lat = getFloatFieldValue(ast, 'lat');
      const lng = getFloatFieldValue(ast, 'lng');
      return { lat, lng };
    }
    if (ast.kind === Kind.NULL) {
      return null;
    }
    throw new Error(`Expected Location to be an object, got ${ast.kind}`);
  },
});

function assertLocation(value: unknown): asserts value is Location {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`Expected Location to be an object, got ${typeof value}`);
  }
  const { lat, lng } = value as Location;
  if (typeof lat !== 'number') {
    throw new Error(`Expected Location.lat to be a number, got ${typeof lat}`);
  }
  if (typeof lng !== 'number') {
    throw new Error(`Expected Location.lng to be a number, got ${typeof lng}`);
  }
  if (lat < -90 || lat > 90) {
    throw new Error(`Expected Location.lat to be between -90 and 90, got ${lat}`);
  }
  if (lng < -180 || lng > 180) {
    throw new Error(`Expected Location.lng to be between -180 and 180, got ${lng}`);
  }
}

function getFloatFieldValue(ast: ObjectValueNode, fieldName: string) {
  const field = ast.fields.find((it) => it.name.value === fieldName);
  if (field) {
    if (field.value.kind === Kind.FLOAT || field.value.kind === Kind.INT) {
      return parseFloat(field.value.value);
    }
    throw new Error(`Expected ${fieldName} to be a float, got ${field.value.kind}`);
  }
  return null;
}
