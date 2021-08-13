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
        'dd has-background text-caption p-1 is-rounded ml-1',
        kindToClassName(kind)
      )}
    >
      {text}
    </span>
  );
}
