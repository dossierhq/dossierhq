import React, { useCallback, useState } from 'react';

interface ColorSwatchProps {
  className: string;
  disabled?: boolean;
}

export function ColorSwatch({ className }: ColorSwatchProps): JSX.Element {
  const [colors, setColors] = useState<null | { backgroundColor: string; color: string }>(null);

  const onRefChanged = useCallback(
    (ref: HTMLDivElement) => {
      if (ref) {
        const { backgroundColor, color } = getComputedStyle(ref);
        setColors({ backgroundColor, color });
      }
    },
    [setColors]
  );

  return (
    <div
      className={`${className} dd-has-background dd-text-body1`}
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

export function ColorSwatchGroup({ className }: ColorSwatchGroupProps): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <ColorSwatch className={className} />
      <ColorSwatch className={`${className} dd-is-disabled`} />
      <ColorSwatch className={`${className} dd-is-hover`} />
      <ColorSwatch className={`${className} dd-is-active`} />
      <ColorSwatch className={`${className} dd-is-selected`} />
    </div>
  );
}
