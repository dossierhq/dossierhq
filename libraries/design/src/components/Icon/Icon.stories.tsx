import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { IconProps } from './Icon';
import { Icon } from './Icon';

interface StoryProps extends IconProps {
  prefixText?: string;
  suffixText?: string;
}

const meta: Meta<IconProps> = {
  title: 'Components/Icon',
  component: Icon,
  args: {},
};
export default meta;

const Template: Story<StoryProps> = ({ prefixText, suffixText, ...args }: StoryProps) => {
  if (prefixText || suffixText) {
    return (
      <p>
        {prefixText}
        <Icon {...args} />
        {suffixText}
      </p>
    );
  }
  return <Icon {...args} />;
};

export const Normal = Template.bind({});
Normal.args = { icon: 'chevronDown' };

export const Empty = Template.bind({});
Empty.args = { icon: null };

export const TextIcon = Template.bind({});
TextIcon.args = { icon: 'map', text: true, prefixText: 'Icon in', suffixText: 'text' };
