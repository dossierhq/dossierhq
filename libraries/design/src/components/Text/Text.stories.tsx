import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { TextProps } from './Text.js';
import { Text } from './Text.js';

type StoryProps = TextProps;

const meta: Meta<TextProps> = {
  title: 'Components/Text',
  component: Text,
  args: { children: 'Lorem ipsum', textStyle: 'body1' },
};
export default meta;

const Template: Story<StoryProps> = ({ ...args }: StoryProps) => {
  return <Text {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};

export const WithNestedSpan = Template.bind({});
WithNestedSpan.args = {
  children: (
    <>
      Hello{' '}
      <Text as="span" textStyle="body2">
        World
      </Text>
      !
    </>
  ),
};

export const Danger = Template.bind({});
Danger.args = { color: 'danger' };
