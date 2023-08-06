// eslint-disable-next-line @typescript-eslint/ban-types
export type LooseAutocomplete<T> = T | (string & {});

/** The reverse of Readonly<T> */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
