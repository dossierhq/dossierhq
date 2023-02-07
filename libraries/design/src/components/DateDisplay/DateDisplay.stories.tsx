import type { Meta, StoryObj } from '@storybook/react';
import { DateDisplay } from './DateDisplay.js';

const meta = {
  title: 'Components/DateDisplay',
  component: DateDisplay,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof DateDisplay>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Now: Story = { args: { date: new Date() } };

export const TwoHoursAgo: Story = { args: { date: new Date(Date.now() - 2 * 60 * 60 * 1000) } };

export const TwoDaysAgo: Story = { args: { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } };

export const TenDaysAgo: Story = {
  args: { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
};

export const AYearAgo: Story = { args: { date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } };
