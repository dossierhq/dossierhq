import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  children: ReactNode;
}

export function Portal({ children }: Props) {
  const [container] = useState(() => {
    const div = document.createElement('div');
    div.setAttribute('class', 'portal-container');
    return div;
  });

  useEffect(() => {
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  }, [container]);

  return createPortal(children, container);
}
