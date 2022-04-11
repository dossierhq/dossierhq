import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { Tag } from '../Tag/Tag';
import type { TagInputProps } from './TagInput';
import { TagInput } from './TagInput';

type StoryProps = TagInputProps;

const meta: Meta<StoryProps> = {
  title: 'Components/TagInput',
  component: TagInput,
  args: {},
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return <Wrapper {...args} />;
};

function Wrapper({ ...args }: StoryProps) {
  return <TagInput {...args} />;
}

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <>
      <Tag color="archived">
        One
        <Tag.Remove />
      </Tag>
      <Tag color="archived">Two</Tag>
      <Tag color="archived">Three</Tag>
    </>
  ),
};

export const ManyTags = Template.bind({});
ManyTags.args = {
  children: (
    <>
      <Tag color="archived">One two three</Tag>
      <Tag color="archived">One wlekjlwerkjwelkrj lksdjf</Tag>
      <Tag color="archived">One wlekjlwerkjwelkrj lksdjf</Tag>
      <Tag color="archived">One wlekjlwerkjwelkrj lksdjf</Tag>
      <Tag color="archived">One wlekjlwerkjwelkrj lksdjf</Tag>
    </>
  ),
};
