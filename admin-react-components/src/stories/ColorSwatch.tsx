import React, { useCallback, useState } from 'react';

interface ColorSwatchProps {
  className: string;
  disabled?: boolean;
}

export function ColorSwatch({ className }: ColorSwatchProps) {
  const [colors, setColors] = useState<null | { backgroundColor: string; color: string }>(null);

  const onRefChanged = useCallback(
    (ref) => {
      if (ref) {
        const { backgroundColor, color } = getComputedStyle(ref);
        setColors({ backgroundColor, color });
      }
    },
    [setColors]
  );

  return (
    <div
      className={`dd ${className} has-background text-body1`}
      ref={onRefChanged}
      style={{
        width: '150px',
        height: '150px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {className}
      <br />
      {colors ? (
        <>
          {colors.backgroundColor}
          <br />
          {colors.color}
        </>
      ) : null}
    </div>
  );
}

interface ColorSwatchGroupProps {
  className: string;
}

export function ColorSwatchGroup({ className }: ColorSwatchGroupProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <ColorSwatch className={className} />
      <ColorSwatch className={`${className} is-disabled`} />
      <ColorSwatch className={`${className} is-hover`} />
      <ColorSwatch className={`${className} is-active`} />
    </div>
  );
}
