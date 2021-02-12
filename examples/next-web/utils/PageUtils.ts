import type { ObjectSchema } from 'joi';
import Joi from 'joi';
import type { ParsedUrlQuery } from 'querystring';

export const urls = {
  entitiesPage: (id: string): string => `/entities/${id}`,
  entitiesPageNew: (entityType: string): string => `/entities/new?type=${entityType}`,
};

export function validateQuery<T>(value: ParsedUrlQuery, schema: ObjectSchema<T>): T {
  return Joi.attempt(value, schema);
}
