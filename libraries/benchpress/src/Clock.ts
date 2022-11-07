export interface BenchPressClock {
  start: () => void;
  stop: () => void;
}

interface ControlClock {
  reset: () => void;
  duration_ms: () => number;
}

export function createClock(): { clock: BenchPressClock; controlClock: ControlClock } {
  let startTime: number | null = null;
  let duration: number | null = null;

  return {
    clock: {
      start: () => {
        if (startTime !== null) {
          throw new Error('Called start() twice in a row');
        } else {
          startTime = performance.now();
        }
      },
      stop: () => {
        const now = performance.now();
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
      duration_ms: () => {
        if (duration === null) {
          throw new Error('Did not call clock.stop()');
        }
        return duration;
      },
    },
  };
}
