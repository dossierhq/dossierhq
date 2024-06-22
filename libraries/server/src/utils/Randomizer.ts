export class Randomizer {
  #prng: () => number;

  constructor(seed: number) {
    this.#prng = mulberry32(seed);
  }

  randomInt(max: number): number {
    return Math.floor(this.#prng() * max);
  }

  shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.randomInt(i + 1);
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }
}

// https://github.com/bryc/code/blob/master/jshash/PRNGs.md
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
