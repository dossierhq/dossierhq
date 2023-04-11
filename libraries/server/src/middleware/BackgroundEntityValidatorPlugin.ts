import {
  AdminClientOperationName,
  type AdminClient,
  type AdminClientMiddleware,
  type AdminClientOperation,
  type Logger,
  type OkFromResult,
  type PublishedClientMiddleware,
  type PublishedClientOperation,
} from '@dossierhq/core';
import type { SessionContext } from '../Context.js';
import type { Server, ServerPlugin } from '../Server.js';

const TIME_SINCE_LAST_OPERATION_MS = 1000 * 2;
const TIME_SINCE_LAST_REVALIDATION_MS = 5;

export class BackgroundEntityValidatorPlugin implements ServerPlugin {
  private server: Server;
  private logger: Logger;
  private handle: NodeJS.Timeout | null = null;
  private lastOperationTimestamp = 0;
  private revalidate = false;
  private batchCount = 0;

  constructor(server: Server, logger: Logger) {
    this.server = server;
    this.logger = logger;

    this.tick = this.tick.bind(this);
    this.adminMiddleware = this.adminMiddleware.bind(this);
    this.publishedMiddleware = this.publishedMiddleware.bind(this);
  }

  start() {
    this.logger.info('BackgroundEntityValidatorPlugin: starting');
    this.revalidate = true;
    this.batchCount = 0;
    if (this.handle) {
      clearTimeout(this.handle);
    }
    this.handle = setTimeout(this.tick, TIME_SINCE_LAST_OPERATION_MS);
  }

  onServerShutdown() {
    this.logger.info('BackgroundEntityValidatorPlugin: stopping');
    if (this.handle) {
      clearTimeout(this.handle);
      this.handle = null;
    }
  }

  onCreateAdminClient(
    pipeline: AdminClientMiddleware<SessionContext>[]
  ): AdminClientMiddleware<SessionContext>[] {
    return [this.adminMiddleware, ...pipeline];
  }

  onCreatePublishedClient(
    pipeline: PublishedClientMiddleware<SessionContext>[]
  ): PublishedClientMiddleware<SessionContext>[] {
    return [this.publishedMiddleware, ...pipeline];
  }

  private async adminMiddleware(_context: SessionContext, operation: AdminClientOperation) {
    this.lastOperationTimestamp = Date.now();

    const result = await operation.next();
    if (operation.name === AdminClientOperationName.updateSchemaSpecification && result.isOk()) {
      const payload = result.value as OkFromResult<
        ReturnType<AdminClient['updateSchemaSpecification']>
      >;
      if (payload.effect === 'updated') {
        this.revalidate = true;
        if (!this.handle) {
          this.logger.info(
            'BackgroundEntityValidatorPlugin: starting revalidation after schema update'
          );
          this.handle = setTimeout(this.tick, TIME_SINCE_LAST_OPERATION_MS);
        }
      }
    }
    operation.resolve(result);
  }

  private async publishedMiddleware(_context: SessionContext, operation: PublishedClientOperation) {
    this.lastOperationTimestamp = Date.now();

    const result = await operation.next();
    operation.resolve(result);
  }

  private async tick() {
    this.handle = null;

    const timeSinceLastOperation = Date.now() - this.lastOperationTimestamp;
    if (timeSinceLastOperation < TIME_SINCE_LAST_OPERATION_MS) {
      this.handle = setTimeout(this.tick, TIME_SINCE_LAST_OPERATION_MS - timeSinceLastOperation);
      return;
    }

    if (this.revalidate) {
      const result = await this.server.revalidateNextEntity();
      this.batchCount++;

      if (this.batchCount % 200 === 0) {
        this.logger.info(
          'BackgroundEntityValidatorPlugin: revalidated %d entities',
          this.batchCount
        );
      }

      if (result.isOk()) {
        if (result.value) {
          if (!result.value.valid) {
            this.logger.warn(
              'BackgroundEntityValidatorPlugin: revalidated entity: %s, but it was invalid',
              result.value.id
            );
          }
        } else {
          this.logger.info(
            'BackgroundEntityValidatorPlugin: no more entities to revalidate, validated %d entities',
            this.batchCount
          );
          this.revalidate = false;
          this.batchCount = 0;
        }
      } else {
        this.logger.error(
          'BackgroundEntityValidatorPlugin: failed validating %s: %s',
          result.error,
          result.message
        );
      }
    }

    if (this.revalidate) {
      this.handle = setTimeout(this.tick, TIME_SINCE_LAST_REVALIDATION_MS);
    }
  }
}
