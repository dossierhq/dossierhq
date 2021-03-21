import React from 'react';
import type { SpacingSize } from '..';
import { joinClassNames } from '../utils/ClassNameUtils';

interface MarginSwatchProps {
  className: string;
}

export function MarginSwatch({ className }: MarginSwatchProps): JSX.Element {
  return (
    <div style={{ border: 'solid 1px black' }}>
      <p
        className={joinClassNames('dd text-caption', className)}
        style={{
          width: '30px',
          height: '30px',
          backgroundColor: 'green',
          textAlign: 'center',
          padding: '0.5rem',
        }}
      >
        {className}
      </p>
    </div>
  );
}

interface MarginSwatchGroupProps {
  size: SpacingSize;
}

export function MarginSwatchGroup({ size }: MarginSwatchGroupProps): JSX.Element {
  return (
    <div className="dd flex-row g-2" style={{ alignItems: 'center' }}>
      <MarginSwatch className={`m-${size}`} />
      <MarginSwatch className={`mx-${size}`} />
      <MarginSwatch className={`my-${size}`} />
      <MarginSwatch className={`ml-${size}`} />
      <MarginSwatch className={`mt-${size}`} />
      <MarginSwatch className={`mr-${size}`} />
      <MarginSwatch className={`mb-${size}`} />
    </div>
  );
}
