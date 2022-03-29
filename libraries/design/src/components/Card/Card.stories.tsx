import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { CardProps } from './Card.js';
import { Card } from './Card.js';

const meta: Meta<CardProps> = {
  title: 'Components/Card',
  component: Card,
  parameters: { layout: 'centered' },
};
export default meta;

const Template: Story<CardProps> = (args) => {
  return <Card {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <>
      <Card.Header>Header</Card.Header>
      <Card.Content>Content</Card.Content>
      <Card.Footer>
        <Card.FooterItem>Footer</Card.FooterItem>
      </Card.Footer>
    </>
  ),
};
