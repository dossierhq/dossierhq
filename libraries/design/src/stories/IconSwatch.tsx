import React from 'react';
import type { IconName, IconProps } from '../components/Icon/Icon.js';
import { ICON_NAMES } from '../components/Icon/Icon.jsx';
import { Icon, Table } from '../components/index.js';

const sizes = ['small', '', 'medium', 'large'] as const;

export function IconSwatch({ icon }: IconProps): JSX.Element {
  return (
    <Table.Row>
      <Table.Cell>{icon}</Table.Cell>
      {sizes.map((size, i) => (
        <Table.Cell key={i}>
          <Icon size={size} icon={icon} style={{ border: '1px solid lightgray' }} />
        </Table.Cell>
      ))}
    </Table.Row>
  );
}

export function AllIconSwatches(): JSX.Element {
  return (
    <Table>
      <Table.Head>
        <Table.Row>
          <Table.Header>Name</Table.Header>
          {sizes.map((size, i) => (
            <Table.Header key={i}>{`Size: ${size}`}</Table.Header>
          ))}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {ICON_NAMES.map((icon) => (
          <IconSwatch key={icon} icon={icon as IconName} />
        ))}
      </Table.Body>
    </Table>
  );
}
