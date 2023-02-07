import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { Text } from '../Text/Text.js';
import type { CardProps } from './Card.js';
import { Card } from './Card.js';

const meta: Meta<CardProps> = {
  title: 'Components/Card',
  component: Card,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;

const Template: Story<CardProps> = (args) => {
  return <Card {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <>
      <Card.Header>
        <Card.HeaderTitle>Header</Card.HeaderTitle>
      </Card.Header>
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
      <Card.Header>
        <Card.HeaderTitle>Header</Card.HeaderTitle>
      </Card.Header>
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
      <Card.Header>
        <Card.HeaderTitle>Header</Card.HeaderTitle>
      </Card.Header>
      <Card.Content>Content</Card.Content>
      <Card.Footer>
        <Card.FooterButton>First</Card.FooterButton>
        <Card.FooterButton>Second button</Card.FooterButton>
      </Card.Footer>
    </>
  ),
};

export const Dropdown = Template.bind({});
Dropdown.args = {
  children: (
    <>
      <Card.Header>
        <Card.HeaderTitle>Header</Card.HeaderTitle>
        <Card.HeaderDropdown
          items={[
            { id: '1', title: 'One' },
            { id: '2', title: 'Two' },
            { id: '3', title: 'Three' },
          ]}
          renderItem={(item) => item.title}
          onItemClick={console.log}
        />
      </Card.Header>
      <Card.Content>Content</Card.Content>
    </>
  ),
};

export const CloseButton = Template.bind({});
CloseButton.args = {
  children: (
    <>
      <Card.Header>
        <Card.HeaderTitle>Header</Card.HeaderTitle>
        <Card.HeaderIconButton icon="close" onClick={console.log} />
      </Card.Header>
      <Card.Content>Content</Card.Content>
    </>
  ),
};
