interface ConsoleLike {
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

export interface Logger {
  /**
   * @param message Message
   */
  error(message: string): void;
  /**
   * @param message Message
   * @param data Additional data to log
   */
  error(message: string, data: unknown): void;
  /**
   * @param message Message
   */
  warn(message: string): void;
  /**
   * @param message Message
   * @param data Additional data to log
   */
  warn(message: string, data: unknown): void;
  /**
   * @param message Message
   */
  info(message: string): void;
  /**
   * @param message Message
   * @param data Additional data to log
   */
  info(message: string, data: unknown): void;
  /**
   * @param message Message
   */
  debug(message: string): void;
  /**
   * @param message Message
   * @param data Additional data to log
   */
  debug(message: string, data: unknown): void;
}

export interface LoggerContext {
  readonly logger: Logger;
}

const noop = (): void => {
  // no-op
};
export const NoOpLogger: Logger = {
  error: noop,
  warn: noop,
  info: noop,
  debug: noop,
};

export function createConsoleLogger(console: ConsoleLike): Logger {
  return {
    error(message: string, data?: unknown): void {
      if (arguments.length === 1) {
        console.error(`error: ${message}`);
      } else {
        console.error(`error: ${message}`, data);
      }
    },
    warn(message: string, data?: unknown): void {
      if (arguments.length === 1) {
        console.warn(`warn: ${message}`);
      } else {
        console.warn(`warn: ${message}`, data);
      }
    },
    info(message: string, data?: unknown): void {
      if (arguments.length === 1) {
        console.info(`info: ${message}`);
      } else {
        console.info(`info: ${message}`, data);
      }
    },
    debug(message: string, data?: unknown): void {
      if (arguments.length === 1) {
        console.debug(`debug: ${message}`);
      } else {
        console.debug(`debug: ${message}`, data);
      }
    },
  };
}
