import { useState } from 'react';

// from https://gist.github.com/poteto/37c076bf112a07ba39d0e5f0645fec43

const $empty = Symbol.for('react.memo_cache_sentinel');
/**
 * DANGER: this hook is NEVER meant to be called directly!
 *
 * Note that this is a temporary userspace implementation of this function
 * from React 19. It is not as efficient and may invalidate more frequently
 * than the official API. Please upgrade to React 19 as soon as you can.
 **/
export function c(size: number) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, react-hooks/rules-of-hooks
  return useState(() => {
    const $ = new Array(size);
    for (let ii = 0; ii < size; ii++) {
      $[ii] = $empty;
    }
    // @ts-expect-error Marking array as empty
    $[$empty] = true;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return $;
  })[0];
}
