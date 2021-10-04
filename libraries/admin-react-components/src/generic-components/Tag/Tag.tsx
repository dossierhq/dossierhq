import React from 'react';
import { joinClassNames } from '../../utils/ClassNameUtils.js';
import type { Kind } from '../../utils/KindUtils.js';
import { kindToClassName } from '../../utils/KindUtils.js';

export interface TagProps {
  kind: Kind;
  text: string;
}

export function Tag({ kind, text }: TagProps): JSX.Element {
  return (
    <span
      className={joinClassNames(
        'dd-has-background dd-text-caption dd-p-1 dd-is-rounded dd-ml-1',
        kindToClassName(kind)
      )}
    >
      {text}
    </span>
  );
}
