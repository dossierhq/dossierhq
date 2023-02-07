import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Menu } from './Menu.js';

const meta = {
  title: 'Components/Menu',
  component: Menu,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof Menu>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    children: (
      <>
        <Menu.Label>Label</Menu.Label>
        <Menu.List>
          <Menu.Item active>
            <a className="is-active">One</a>
          </Menu.Item>
          <Menu.Item>
            <a>Two</a>
          </Menu.Item>
          <Menu.Item>
            <a>Three</a>
          </Menu.Item>
        </Menu.List>
      </>
    ),
  },
};

export const TwoLevels: Story = {
  args: {
    children: (
      <>
        <Menu.Label>Label</Menu.Label>
        <Menu.List>
          <Menu.Item active>
            <a className="is-active">One</a>
          </Menu.Item>
          <Menu.Item>
            <a>Two</a>
            <Menu.List>
              <Menu.Item>
                <a>Two a</a>
              </Menu.Item>
            </Menu.List>
          </Menu.Item>
          <Menu.Item>
            <a>Three</a>
          </Menu.Item>
        </Menu.List>
      </>
    ),
  },
};
