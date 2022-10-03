import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { DateDisplayProps } from './DateDisplay.js';
import { DateDisplay } from './DateDisplay.js';

type StoryProps = DateDisplayProps;

const meta: Meta<StoryProps> = {
  title: 'Components/DateDisplay',
  component: DateDisplay,
  args: {},
};
export default meta;

const Template: Story<StoryProps> = ({ ...args }: StoryProps) => {
  return <DateDisplay {...args} />;
};

export const Now = Template.bind({});
Now.args = { date: new Date() };

export const TwoHoursAgo = Template.bind({});
TwoHoursAgo.args = { date: new Date(Date.now() - 2 * 60 * 60 * 1000) };

export const TwoDaysAgo = Template.bind({});
TwoDaysAgo.args = { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) };

export const TenDaysAgo = Template.bind({});
TenDaysAgo.args = { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) };

export const AYearAgo = Template.bind({});
AYearAgo.args = { date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) };
