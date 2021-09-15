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
        className={joinClassNames('dd-text-caption', className)}
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
    <div className="dd-flex-row dd-g-2" style={{ alignItems: 'center' }}>
      <MarginSwatch className={`dd-m-${size}`} />
      <MarginSwatch className={`dd-mx-${size}`} />
      <MarginSwatch className={`dd-my-${size}`} />
      <MarginSwatch className={`dd-ml-${size}`} />
      <MarginSwatch className={`dd-mt-${size}`} />
      <MarginSwatch className={`dd-mr-${size}`} />
      <MarginSwatch className={`dd-mb-${size}`} />
    </div>
  );
}
