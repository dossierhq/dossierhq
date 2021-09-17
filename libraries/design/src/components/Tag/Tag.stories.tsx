import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { TagProps } from './Tag';
import { Tag } from './Tag';

const meta: Meta<TagProps> = {
  title: 'Components/Tag',
  component: Tag,
  args: {},
};
export default meta;

const Template: Story<TagProps> = (args) => {
  return <Tag {...args} />;
};

export const Normal = Template.bind({});
Normal.args = { children: 'Tag' };

export const Remove = Template.bind({});
Remove.args = { children: ['Tag', <Tag.Remove key="1" />] };

export const Published = Template.bind({});
Published.args = { children: 'Published', color: 'published' };

export const PublishedRemove = Template.bind({});
PublishedRemove.args = { color: 'published', children: ['Tag', <Tag.Remove key="1" />] };
