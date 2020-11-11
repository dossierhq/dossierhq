export interface BenchPressClock {
  start: () => void;
  stop: () => void;
}

export function createClock() {
  let startTime: bigint | null = null;
  let duration: bigint | null = null;

  return {
    clock: {
      start: () => {
        if (startTime !== null) {
          throw new Error('Called start() twice in a row');
        } else {
          startTime = process.hrtime.bigint();
        }
      },
      stop: () => {
        const now = process.hrtime.bigint();
        if (startTime !== null) {
          duration = now - startTime;
        } else {
          throw new Error('Called stop() before start()');
        }
      },
    },
    controlClock: {
      reset: () => {
        startTime = duration = null;
      },
      duration_ns: () => {
        if (duration === null) {
          throw new Error('Did not call clock.stop()');
        }
        return duration;
      },
    },
  };
}
