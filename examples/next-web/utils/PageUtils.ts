import type { ObjectSchema } from 'joi';
import Joi from 'joi';
import type { ParsedUrlQuery } from 'querystring';

export const urls = {
  editPage: (ids: string[]): string => `/entities/edit?ids=${ids.join(',')}`,
  editPageNew: (entityType: string): string => `/entities/edit?type=${entityType}`,
};

export function validateQuery<T>(value: ParsedUrlQuery, schema: ObjectSchema<T>): T {
  return Joi.attempt(value, schema);
}
