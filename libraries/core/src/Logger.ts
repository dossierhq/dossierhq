// Formatting placeholders compatible with node and pino: %s %d %O
// https://nodejs.org/api/util.html#util_util_format_format_args
// https://github.com/pinojs/pino/blob/master/docs/api.md#message

interface ConsoleLike {
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

export interface Logger {
  /**
   * @param message Message with printf formatting (%s, %d, %O)
   * @param args Arguments to formatting
   */
  error(message: string, ...args: unknown[]): void;
  /**
   * @param message Message with printf formatting (%s, %d, %O)
   * @param args Arguments to formatting
   */
  warn(message: string, ...args: unknown[]): void;
  /**
   * @param message Message with printf formatting (%s, %d, %O)
   * @param args Arguments to formatting
   */
  info(message: string, ...args: unknown[]): void;
  /**
   * @param message Message with printf formatting (%s, %d, %O)
   * @param args Arguments to formatting
   */
  debug(message: string, ...args: unknown[]): void;
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
    error(message, ...args) {
      console.error(`error: ${message}`, ...args);
    },
    warn(message, ...args) {
      console.warn(`warn: ${message}`, ...args);
    },
    info(message, ...args) {
      console.info(`info: ${message}`, ...args);
    },
    debug(message, ...args) {
      console.debug(`debug: ${message}`, ...args);
    },
  };
}
