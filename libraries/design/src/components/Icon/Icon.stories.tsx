import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { IconProps } from './Icon.js';
import { Icon } from './Icon.js';

interface StoryProps extends IconProps {
  prefixText?: string;
  suffixText?: string;
}

const meta: Meta<StoryProps> = {
  title: 'Components/Icon',
  component: Icon,
  args: { icon: 'list' },
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
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
  return (
    <div style={{ backgroundColor: '#1111' }}>
      <Icon {...args} />
    </div>
  );
};

export const Normal = Template.bind({});
Normal.args = { icon: 'chevronDown' };

export const Empty = Template.bind({});
Empty.args = { icon: null };

export const TextIcon = Template.bind({});
TextIcon.args = { icon: 'map', text: true, prefixText: 'Icon in', suffixText: 'text' };

export const SizeLarge = Template.bind({});
SizeLarge.args = { size: 'large' };
