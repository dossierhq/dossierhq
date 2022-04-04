import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { Text } from '../Text/Text.js';
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
        <Card.FooterItem>First</Card.FooterItem>
        <Card.FooterItem>
          <a>Second footer</a>
        </Card.FooterItem>
      </Card.Footer>
    </>
  ),
};

export const TwoParagraphsInContent = Template.bind({});
TwoParagraphsInContent.args = {
  children: (
    <>
      <Card.Header>Header</Card.Header>
      <Card.Content>
        <Text textStyle="body1">First paragraph</Text>
        <Text textStyle="body2">Second paragraph</Text>
      </Card.Content>
      <Card.Footer>
        <Card.FooterItem>First</Card.FooterItem>
        <Card.FooterItem>
          <a>Second footer</a>
        </Card.FooterItem>
      </Card.Footer>
    </>
  ),
};

export const FooterButtons = Template.bind({});
FooterButtons.args = {
  children: (
    <>
      <Card.Header>Header</Card.Header>
      <Card.Content>Content</Card.Content>
      <Card.Footer>
        <Card.FooterButton>First</Card.FooterButton>
        <Card.FooterButton>Second button</Card.FooterButton>
      </Card.Footer>
    </>
  ),
};
