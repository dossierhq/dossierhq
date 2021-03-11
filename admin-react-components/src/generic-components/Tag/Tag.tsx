import React from 'react';
import type { Kind } from '../../utils/KindUtils';
import { kindToClassName } from '../../utils/KindUtils';

export interface TagProps {
  kind: Kind;
  text: string;
}

export function Tag({ kind, text }: TagProps): JSX.Element {
  return <span className={`dd has-background text-caption ${kindToClassName(kind)}`}>{text}</span>;
}
