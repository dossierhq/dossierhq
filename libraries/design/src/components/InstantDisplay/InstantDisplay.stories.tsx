import { Temporal } from '@js-temporal/polyfill';
import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { InstantDisplayProps } from './InstantDisplay.js';
import { InstantDisplay } from './InstantDisplay.js';

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

export const TwoDaysAgo = Template.bind({});
TwoDaysAgo.args = { instant: Temporal.Now.instant().subtract({ hours: 24 * 2 }) };

export const TenDaysAgo = Template.bind({});
TenDaysAgo.args = { instant: Temporal.Now.instant().subtract({ hours: 24 * 10 }) };

export const AYearAgo = Template.bind({});
AYearAgo.args = { instant: Temporal.Now.instant().subtract({ hours: 24 * 365 }) };
