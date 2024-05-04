'use client';

import { useRef } from 'react';
import { useWindowEventListener } from '../../hooks/useWindowEventListener.js';

interface Props {
  message: string;
}

export function BeforeUnload({ message }: Props) {
  const currentMessage = useRef(message);
  currentMessage.current = message;
  useWindowEventListener('beforeunload', (event) => {
    event.returnValue = currentMessage.current;
  });

  return null;
}
