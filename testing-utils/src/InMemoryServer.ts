import type { AdminEntity, Schema } from '@datadata/core';
import { InMemoryServerInner } from './InMemoryServerInner';

export interface InMemoryEntity {
  versions: AdminEntity[];
  publishedVersion?: number | null;
  history: { version: number; createdBy: string; createdAt: Date }[];
  publishEvents: { version: number | null; publishedBy: string; publishedAt: Date }[];
}

export interface JsonInMemoryEntity extends Omit<InMemoryEntity, 'history' | 'publishEvents'> {
  history: { version: number; createdBy: string; createdAt: string }[];
  publishEvents: { version: number | null; publishedBy: string; publishedAt: string }[];
}

export interface InMemorySessionContext {
  server: InMemoryServerInner;
  userId: string;
}

export class InMemoryServer {
  #inner: InMemoryServerInner;

  get schema(): Schema {
    return this.#inner.schema;
  }

  constructor(schema: Schema) {
    this.#inner = new InMemoryServerInner(schema);
  }

  createContext(userId: string): InMemorySessionContext {
    return { server: this.#inner, userId };
  }

  loadEntities(entities: JsonInMemoryEntity[]): void {
    this.#inner.loadEntities(entities);
  }
}
