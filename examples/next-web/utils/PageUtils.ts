import type { EntityReference } from '@jonasb/datadata-core';
import type { ObjectSchema } from 'joi';
import Joi from 'joi';
import type { ParsedUrlQuery } from 'querystring';

export const urls = {
  editPage: (ids: string[]): string => `/entities/edit?ids=${ids.join(',')}`,
  editPageNew: (entityType: string): string => `/entities/edit?type=${entityType}`,
  publishedEntityDetail: (reference: EntityReference): string =>
    `/published-entities/${reference.id}`,
};

export function validateQuery<T>(value: ParsedUrlQuery, schema: ObjectSchema<T>): T {
  return Joi.attempt(value, schema);
}
