import React from 'react';
import type { Kind } from '../..';
import { kindToClassName } from '../../utils/KindUtils';
import { IconButton, Stack } from '../..';

export interface MessageItem {
  kind?: Kind;
  title?: string;
  message?: string;
}

export interface MessageProps extends MessageItem {
  onDismiss: () => void;
}

export function Message({ kind, title, message, onDismiss }: MessageProps): JSX.Element {
  return (
    <div className={`dd message has-background has-shadow ${kindToClassName(kind)}`}>
      <Stack>
        <Stack.Layer top right>
          <IconButton icon="remove" title="Close" onClick={onDismiss} />
        </Stack.Layer>
        {title ? <p className="dd text-headline5">{title}</p> : null}
        {message ? <p className="dd text-body1">{message}</p> : null}
      </Stack>
    </div>
  );
}
