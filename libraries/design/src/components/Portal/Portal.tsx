import type { ReactNode, ReactPortal } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  children: ReactNode;
}

export function Portal({ children }: Props): ReactPortal {
  const [container] = useState(() => {
    const div = document.createElement('div');
    div.setAttribute('class', 'portal-container');
    return div;
  });

  useEffect(() => {
    const portalRoot = getPortalRoot();
    portalRoot.appendChild(container);
    return () => {
      portalRoot.removeChild(container);
    };
  }, [container]);

  return createPortal(children, container);
}

function getPortalRoot() {
  let portalRoot = document.getElementById('portal-root');
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'portal-root');
    document.body.appendChild(portalRoot);
  }
  return portalRoot;
}
