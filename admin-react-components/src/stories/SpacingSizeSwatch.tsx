import React, { useCallback, useState } from 'react';

interface SpacingSizeSwatchProps {
  size: SpacingSize;
}

export function SpacingSizeSwatch({ size }: SpacingSizeSwatchProps): JSX.Element {
  const [computedSize, setComputesSize] = useState<string | null>(null);

  const onRefChanged = useCallback((ref) => {
    if (ref) {
      const { marginLeft } = getComputedStyle(ref);
      setComputesSize(marginLeft);
    }
  }, []);

  return (
    <div className="dd text-body">
      Size {size}: {computedSize}
      <div className={`dd ml-${size}`} ref={onRefChanged} />
    </div>
  );
}
