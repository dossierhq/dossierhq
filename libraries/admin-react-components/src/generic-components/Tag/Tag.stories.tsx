import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { Tag } from './Tag.js';
import type { TagProps } from './Tag.js';

const meta: Meta<TagProps> = {
  title: 'Generic/Tag',
  component: Tag,
};
export default meta;

const Template: Story<TagProps> = (args) => {
  return <Tag {...args} />;
};

export const Primary = Template.bind({});
Primary.args = { kind: 'primary', text: 'Primary' };

export const Danger = Template.bind({});
Danger.args = { kind: 'danger', text: 'Danger' };
