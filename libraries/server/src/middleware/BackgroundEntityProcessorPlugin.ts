import {
  AdminClientOperationName,
  type DossierClient,
  type AdminClientMiddleware,
  type AdminClientOperation,
  type Logger,
  type OkFromResult,
  type PublishedClientMiddleware,
  type PublishedClientOperation,
} from '@dossierhq/core';
import type { SessionContext } from '../Context.js';
import type { Server, ServerPlugin } from '../Server.js';

const TIME_SINCE_LAST_OPERATION_MS = 2000;
const TIME_SINCE_LAST_PROCESSING_MS = 5;

export class BackgroundEntityProcessorPlugin implements ServerPlugin {
  private server: Server;
  private logger: Logger;
  private handle: ReturnType<typeof setTimeout> | null = null;
  private lastOperationTimestamp = 0;
  private processing = false;
  private batchCount = 0;

  constructor(server: Server, logger: Logger) {
    this.server = server;
    this.logger = logger;
  }

  start() {
    this.logger.info('BackgroundEntityProcessorPlugin: starting');
    this.processing = true;
    this.batchCount = 0;
    if (this.handle) {
      clearTimeout(this.handle);
    }
    this.handle = setTimeout(this.tick, TIME_SINCE_LAST_OPERATION_MS);
  }

  onServerShutdown() {
    this.logger.info('BackgroundEntityProcessorPlugin: stopping');
    if (this.handle) {
      clearTimeout(this.handle);
      this.handle = null;
    }
  }

  onCreateAdminClient(
    pipeline: AdminClientMiddleware<SessionContext>[],
  ): AdminClientMiddleware<SessionContext>[] {
    return [this.adminMiddleware, ...pipeline];
  }

  onCreatePublishedClient(
    pipeline: PublishedClientMiddleware<SessionContext>[],
  ): PublishedClientMiddleware<SessionContext>[] {
    return [this.publishedMiddleware, ...pipeline];
  }

  private adminMiddleware = async (_context: SessionContext, operation: AdminClientOperation) => {
    this.lastOperationTimestamp = Date.now();

    const result = await operation.next();
    if (operation.name === AdminClientOperationName.updateSchemaSpecification && result.isOk()) {
      const payload = result.value as OkFromResult<
        ReturnType<DossierClient['updateSchemaSpecification']>
      >;
      if (payload.effect === 'updated') {
        this.processing = true;
        if (!this.handle) {
          this.logger.info(
            'BackgroundEntityProcessorPlugin: starting processing after schema update',
          );
          this.handle = setTimeout(this.tick, TIME_SINCE_LAST_OPERATION_MS);
        }
      }
    }
    operation.resolve(result);
  };

  private publishedMiddleware = async (
    _context: SessionContext,
    operation: PublishedClientOperation,
  ) => {
    this.lastOperationTimestamp = Date.now();

    const result = await operation.next();
    operation.resolve(result);
  };

  private tick = () => {
    const run = async () => {
      this.handle = null;

      const timeSinceLastOperation = Date.now() - this.lastOperationTimestamp;
      if (timeSinceLastOperation < TIME_SINCE_LAST_OPERATION_MS) {
        this.handle = setTimeout(this.tick, TIME_SINCE_LAST_OPERATION_MS - timeSinceLastOperation);
        return;
      }

      if (this.processing) {
        const result = await this.server.processNextDirtyEntity();
        if (result.isOk() && result.value) {
          this.batchCount++;
        }

        if (this.batchCount % 200 === 0) {
          this.logger.info(
            'BackgroundEntityProcessorPlugin: processed %d entities',
            this.batchCount,
          );
        }

        if (result.isOk()) {
          if (result.value) {
            const { valid, validPublished, previousValid, previousValidPublished } = result.value;
            if (valid !== previousValid || validPublished !== previousValidPublished) {
              this.logger.warn(
                'BackgroundEntityProcessorPlugin: processed entity %s: valid %s (was: %s), validPublished %s (was: %s)',
                result.value.id,
                valid,
                previousValid,
                validPublished,
                previousValidPublished,
              );
            }
          } else {
            this.logger.info(
              'BackgroundEntityProcessorPlugin: no more entities to process, processed %d entities',
              this.batchCount,
            );
            this.processing = false;
            this.batchCount = 0;
          }
        } else {
          this.logger.error(
            'BackgroundEntityProcessorPlugin: failed processing %s: %s',
            result.error,
            result.message,
          );
        }
      }

      if (this.processing) {
        this.handle = setTimeout(this.tick, TIME_SINCE_LAST_PROCESSING_MS);
      }
    };

    void run();
  };
}
