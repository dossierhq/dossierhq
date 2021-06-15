import type { PublishEventKind, Schema } from '@datadata/core';
import { InMemoryServerInner } from './InMemoryServerInner';

export interface InMemoryEntity {
  versions: InMemoryEntityVersion[];
  publishedVersion?: number | null;
  history: { version: number; createdBy: string; createdAt: Date }[];
  publishEvents: {
    kind: PublishEventKind;
    version: number | null;
    publishedBy: string;
    publishedAt: Date;
  }[];
}

export interface InMemoryEntityVersion {
  id: string;
  _name: string;
  _type: string;
  _version: number;
  _deleted?: boolean;
  [fieldName: string]: unknown;
}

export interface JsonInMemoryEntity extends Omit<InMemoryEntity, 'history' | 'publishEvents'> {
  history: { version: number; createdBy: string; createdAt: string }[];
  publishEvents: {
    kind: PublishEventKind;
    version: number | null;
    publishedBy: string;
    publishedAt: string;
  }[];
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
