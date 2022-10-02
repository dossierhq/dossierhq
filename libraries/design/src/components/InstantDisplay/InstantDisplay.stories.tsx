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
Now.args = { instant: new Date() };

export const TwoHoursAgo = Template.bind({});
TwoHoursAgo.args = { instant: new Date(Date.now() - 2 * 60 * 60 * 1000) };

export const TwoDaysAgo = Template.bind({});
TwoDaysAgo.args = { instant: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) };

export const TenDaysAgo = Template.bind({});
TenDaysAgo.args = { instant: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) };

export const AYearAgo = Template.bind({});
AYearAgo.args = { instant: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) };
