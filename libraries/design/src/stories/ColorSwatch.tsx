import React, { useCallback, useState } from 'react';
import { Table } from '../components/Table/Table.js';
import { Color, toBackgroundColorClassName } from '../config/Colors.js';

interface ColorSwatchProps {
  color: Color;
  disabled?: boolean;
}

export function ColorSwatch({ color }: ColorSwatchProps): JSX.Element {
  const [colors, setColors] = useState<null | { backgroundColor: string; color: string }>(null);

  const onRefChanged = useCallback(
    (ref: HTMLDivElement) => {
      if (ref) {
        const { backgroundColor, color } = getComputedStyle(ref);
        setColors({ backgroundColor, color });
      }
    },
    [setColors],
  );

  return (
    <Table.Row>
      <Table.Cell>{color}</Table.Cell>
      <Table.Cell>
        <div
          className={toBackgroundColorClassName(color)}
          ref={onRefChanged}
          style={{
            width: '50px',
            height: '50px',
          }}
        />
      </Table.Cell>
      <Table.Cell>
        <div
          className={toBackgroundColorClassName(color, 'light')}
          ref={onRefChanged}
          style={{
            width: '50px',
            height: '50px',
          }}
        />
      </Table.Cell>
      <Table.Cell>
        <div
          className={toBackgroundColorClassName(color, 'dark')}
          ref={onRefChanged}
          style={{
            width: '50px',
            height: '50px',
          }}
        />
      </Table.Cell>
      <Table.Cell>{colors?.backgroundColor}</Table.Cell>
      <Table.Cell>{colors?.color}</Table.Cell>
    </Table.Row>
  );
}

export function AllColorSwatches() {
  return (
    <Table>
      <Table.Head>
        <Table.Row>
          <Table.Header>Color</Table.Header>
          <Table.Header> </Table.Header>
          <Table.Header>Light</Table.Header>
          <Table.Header>Dark</Table.Header>
          <Table.Header>Background color</Table.Header>
          <Table.Header>Color</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {Object.keys(Color).map((color) => (
          <ColorSwatch key={color} color={color as Color} />
        ))}
      </Table.Body>
    </Table>
  );
}
