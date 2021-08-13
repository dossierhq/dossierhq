import type { PublishingEventKind, Schema } from '@jonasb/datadata-core';
import { InMemoryServerInner } from './InMemoryServerInner';

export interface InMemoryEntity {
  id: string;
  type: string;
  name: string;
  versions: InMemoryEntityVersion[];
  archived?: boolean;
  publishedVersion?: number | null;
  history: { version: number; createdBy: string; createdAt: Date }[];
  publishEvents: {
    kind: PublishingEventKind;
    version: number | null;
    publishedBy: string;
    publishedAt: Date;
  }[];
}

export interface InMemoryEntityVersion {
  _version: number;
  [fieldName: string]: unknown;
}

export interface JsonInMemoryEntity extends Omit<InMemoryEntity, 'history' | 'publishEvents'> {
  history: { version: number; createdBy: string; createdAt: string }[];
  publishEvents: {
    kind: PublishingEventKind;
    version: number | null;
    publishedBy: string;
    publishedAt: string;
  }[];
}

export interface InMemorySessionContext {
  server: InMemoryServerInner;
  subjectId: string;
}

export class InMemoryServer {
  #inner: InMemoryServerInner;

  get schema(): Schema {
    return this.#inner.schema;
  }

  constructor(schema: Schema) {
    this.#inner = new InMemoryServerInner(schema);
  }

  createContext(subjectId: string): InMemorySessionContext {
    return { server: this.#inner, subjectId };
  }

  loadEntities(entities: JsonInMemoryEntity[]): void {
    this.#inner.loadEntities(entities);
  }
}
