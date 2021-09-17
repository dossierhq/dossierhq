import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { Tag } from './Tag';
import type { TagGroupProps } from './Tag';

const meta: Meta<TagGroupProps> = {
  title: 'Components/Tag.Group',
  component: Tag.Group,
  args: {},
};
export default meta;

const Template: Story<TagGroupProps> = (args) => {
  return <Tag.Group {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: [<Tag key="0">One</Tag>, <Tag key="1">Two</Tag>],
};

export const Remove = Template.bind({});
Remove.args = {
  children: [
    <Tag key="0">
      One
      <Tag.Remove />
    </Tag>,
    <Tag key="1">
      Two
      <Tag.Remove />
    </Tag>,
  ],
};

export const RemoveClear = Template.bind({});
RemoveClear.args = {
  children: [
    <Tag key="0">
      One
      <Tag.Remove />
    </Tag>,
    <Tag key="1">
      Two
      <Tag.Remove />
    </Tag>,
    <Tag.Clear key="2">Clear</Tag.Clear>,
  ],
};

export const Status = Template.bind({});
Status.args = {
  children: [
    <Tag key="0" color="draft">
      Draft
    </Tag>,
    <Tag key="1" color="published">
      Published
    </Tag>,
    <Tag key="2" color="modified">
      Modified
    </Tag>,
    <Tag key="3" color="withdrawn">
      Withdrawn
    </Tag>,
    <Tag key="4" color="archived">
      Archived
    </Tag>,
  ],
};
