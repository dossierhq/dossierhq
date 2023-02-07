import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { MenuProps } from './Menu.js';
import { Menu } from './Menu.js';

const meta: Meta<MenuProps> = {
  title: 'Components/Menu',
  component: Menu,
  args: {},
  tags: ['autodocs'],
};
export default meta;

const Template: Story<MenuProps> = (args) => {
  return <Menu {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
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
};

export const TwoLevels = Template.bind({});
TwoLevels.args = {
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
};
