import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { NavBarProps } from './NavBar';
import { NavBar } from './NavBar';

const meta: Meta<NavBarProps> = {
  title: 'Components/NavBar',
  component: NavBar,
  args: {},
};
export default meta;

const Template: Story<NavBarProps> = (args) => {
  return <NavBar {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <>
      <NavBar.Brand>
        <NavBar.Item>Brand</NavBar.Item>
      </NavBar.Brand>
      <NavBar.Item active>Active</NavBar.Item>
      <NavBar.Item>Normal</NavBar.Item>
    </>
  ),
};
