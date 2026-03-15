'use client';

import { useRef } from 'react';
import { useWindowEventListener } from '../../hooks/useWindowEventListener.js';

interface Props {
  message: string;
}

export function BeforeUnload({ message }: Props) {
  const currentMessage = useRef(message);
  // eslint-disable-next-line react-hooks/refs
  currentMessage.current = message;
  useWindowEventListener('beforeunload', (event) => {
    event.returnValue = currentMessage.current;
  });

  return null;
}
