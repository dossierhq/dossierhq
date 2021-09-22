import { Temporal } from '@js-temporal/polyfill';
import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { InstantDisplayProps } from './InstantDisplay';
import { InstantDisplay } from './InstantDisplay';

type StoryProps = InstantDisplayProps;

const meta: Meta<StoryProps> = {
  title: 'Components/InstantDisplay',
  component: InstantDisplay,
  args: {},
};
export default meta;

const Template: Story<StoryProps> = ({ ...args }: StoryProps) => {
  return <InstantDisplay {...args} />;
};

export const Now = Template.bind({});
Now.args = { instant: Temporal.Now.instant() };

export const TenDaysAgo = Template.bind({});
TenDaysAgo.args = { instant: Temporal.Now.instant().subtract({ hours: 24 * 10 }) };
