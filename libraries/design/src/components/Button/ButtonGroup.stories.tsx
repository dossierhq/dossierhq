import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { ButtonGroupProps } from './Button.js';
import { Button } from './Button.js';

type StoryProps = ButtonGroupProps;

const meta: Meta<ButtonGroupProps> = {
  title: 'Components/Button.Group',
  component: Button.Group,
  args: {},
  tags: ['autodocs'],
};
export default meta;

const Template: Story<StoryProps> = ({ ...args }: StoryProps) => {
  return <Button.Group {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <>
      <Button>Foo</Button>
      <Button>Bar</Button>
    </>
  ),
};

export const Centered = Template.bind({});
Centered.args = {
  centered: true,
  children: (
    <>
      <Button>Foo</Button>
      <Button>Bar</Button>
    </>
  ),
};

export const HasAddons = Template.bind({});
HasAddons.args = {
  hasAddons: true,
  children: (
    <>
      <Button>Foo</Button>
      <Button>Bar</Button>
    </>
  ),
};
