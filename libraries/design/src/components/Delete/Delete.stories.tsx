import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { DeleteProps } from './Delete.js';
import { Delete } from './Delete.js';

type StoryProps = DeleteProps;

const meta: Meta<DeleteProps> = {
  title: 'Components/Delete',
  component: Delete,
  args: {},
  tags: ['autodocs'],
};
export default meta;

const Template: Story<StoryProps> = ({ ...args }: StoryProps) => {
  return <Delete {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};
