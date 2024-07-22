import { useState } from 'react';

//TODO this is the cache function for the react-compiler plugin. Remove when switching to react 19 and remove config in vite.config.ts

export function c(size: number) {
  // eslint-disable-next-line react-hooks/rules-of-hooks, @typescript-eslint/no-unsafe-return
  return useState(() => new Array(size))[0];
}
