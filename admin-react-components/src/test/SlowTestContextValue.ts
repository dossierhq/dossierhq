import type { Schema } from '@datadata/core';
import type { DataDataContextValue } from '..';

export class SlowTestContextValue implements DataDataContextValue {
  schema: Schema;
  #inner: DataDataContextValue;

  constructor(inner: DataDataContextValue) {
    this.#inner = inner;
    this.schema = inner.schema;
  }

  private delay() {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  useEntity: DataDataContextValue['useEntity'] = (id, options) => {
    return this.#inner.useEntity(id, options);
  };

  useEntityHistory: DataDataContextValue['useEntityHistory'] = (id) => {
    return this.#inner.useEntityHistory(id);
  };

  useSearchEntities: DataDataContextValue['useSearchEntities'] = (query, paging) => {
    return this.#inner.useSearchEntities(query, paging);
  };

  createEntity: DataDataContextValue['createEntity'] = async (entity, options) => {
    await this.delay();
    return await this.#inner.createEntity(entity, options);
  };

  updateEntity: DataDataContextValue['updateEntity'] = async (entity, options) => {
    await this.delay();
    return await this.#inner.updateEntity(entity, options);
  };
}
