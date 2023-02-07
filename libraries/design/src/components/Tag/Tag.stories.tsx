import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { TagProps } from './Tag.js';
import { Tag } from './Tag.js';

const meta: Meta<TagProps> = {
  title: 'Components/Tag',
  component: Tag,
  args: {},
  tags: ['autodocs'],
};
export default meta;

const Template: Story<TagProps> = (args) => {
  return <Tag {...args} />;
};

export const Normal = Template.bind({});
Normal.args = { children: 'tag' };

export const Remove = Template.bind({});
Remove.args = { children: ['tag', <Tag.Remove key="1" />] };

export const Published = Template.bind({});
Published.args = { children: 'published', color: 'published' };

export const PublishedRemove = Template.bind({});
PublishedRemove.args = { color: 'published', children: ['tag', <Tag.Remove key="1" />] };
