import React from 'react';
import { joinClassNames } from '../../utils/ClassNameUtils';
import type { LegacyKind } from '../../utils/LegacyKindUtils';
import { kindToClassName } from '../../utils/LegacyKindUtils';

export interface TagProps {
  kind: LegacyKind;
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
