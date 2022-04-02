import React from 'react';
import { Column } from '../Column/Column';
import type { IconName } from '../Icon/Icon';
import { Icon } from '../Icon/Icon';
import { Text } from '../Text/Text';

export interface EmptyStateMessageProps {
  icon: IconName;
  title: string;
  message: string;
}

export function EmptyStateMessage({ icon, title, message }: EmptyStateMessageProps) {
  return (
    <Column
      className="is-height-100"
      alignItems="center"
      justifyContent="center"
      padding={5}
      gap={3}
    >
      <Icon icon={icon} size="large" />
      <Text textStyle="headline4">{title}</Text>
      <Text textStyle="body1" className="is-max-width-40rem">
        {message}
      </Text>
    </Column>
  );
}
