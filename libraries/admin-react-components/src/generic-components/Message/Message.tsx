import React from 'react';
import type { Kind } from '../..';
import { IconButton, Stack } from '../..';
import { kindToClassName } from '../../utils/KindUtils';

export interface MessageItem {
  kind?: Kind;
  title?: string;
  message?: string;
}

export interface MessageProps extends MessageItem {
  onDismiss?: () => void;
}

export function Message({ kind, title, message, onDismiss }: MessageProps): JSX.Element {
  return (
    <div className={`dd-message dd-has-background dd-has-shadow ${kindToClassName(kind)}`}>
      <Stack>
        {onDismiss ? (
          <Stack.Layer top right>
            <IconButton icon="remove" title="Close" onClick={onDismiss} />
          </Stack.Layer>
        ) : null}
        {title ? <p className="dd-text-headline5">{title}</p> : null}
        {message ? <p className="dd-text-body1">{message}</p> : null}
      </Stack>
    </div>
  );
}
