import React from 'react';
import type { Kind } from '../..';
import { kindToClassName } from '../../utils/KindUtils';

export interface MessageProps {
  kind?: Kind;
  title?: string;
  message?: string;
}

export function Message({ kind, title, message }: MessageProps): JSX.Element {
  return (
    <div className={`dd message has-background has-shadow ${kindToClassName(kind)}`}>
      {title ? <p className="dd text-headline5">{title}</p> : null}
      {message ? <p className="dd text-body1">{message}</p> : null}
    </div>
  );
}
