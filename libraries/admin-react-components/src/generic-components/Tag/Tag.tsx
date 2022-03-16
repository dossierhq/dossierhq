import React from 'react';
import { joinClassNames } from '../../utils/ClassNameUtils';
import type { Kind } from '../../utils/KindUtils';
import { kindToClassName } from '../../utils/KindUtils';

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
