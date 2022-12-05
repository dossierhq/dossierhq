import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { NavbarProps } from './Navbar.js';
import { Navbar } from './Navbar.js';

const meta: Meta<NavbarProps> = {
  title: 'Components/Navbar',
  component: Navbar,
  args: {},
};
export default meta;

const Template: Story<NavbarProps> = (args) => {
  return <Navbar {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <>
      <Navbar.Brand>
        <Navbar.Item>{NavItemRender('Brand')}</Navbar.Item>
        <Navbar.Burger
          active={false}
          onClick={() => {
            //empty
          }}
        />
      </Navbar.Brand>
      <Navbar.Menu active={false}>
        <Navbar.Item active>{NavItemRender('Active')}</Navbar.Item>
        <Navbar.Item>{NavItemRender('Normal')}</Navbar.Item>
      </Navbar.Menu>
    </>
  ),
};

export const Active = Template.bind({});
Active.args = {
  children: (
    <>
      <Navbar.Brand>
        <Navbar.Item>{NavItemRender('Brand')}</Navbar.Item>
        <Navbar.Burger
          active
          onClick={() => {
            //empty
          }}
        />
      </Navbar.Brand>
      <Navbar.Menu active>
        <Navbar.Item active>{NavItemRender('Active')}</Navbar.Item>
        <Navbar.Item>{NavItemRender('Normal')}</Navbar.Item>
      </Navbar.Menu>
    </>
  ),
};

export const Dropdown = Template.bind({});
Dropdown.args = {
  children: (
    <>
      <Navbar.Brand>
        <Navbar.Item>{NavItemRender('Brand')}</Navbar.Item>
        <Navbar.Burger
          active={false}
          onClick={() => {
            //empty
          }}
        />
      </Navbar.Brand>
      <Navbar.Menu active={false}>
        <Navbar.Item>{NavItemRender('Active')}</Navbar.Item>
        <Navbar.Item>{NavItemRender('Normal')}</Navbar.Item>
        <Navbar.Dropdown renderLink={(className) => <a className={className}>Dropdown</a>}>
          <Navbar.Item active>{NavItemRender('Active dropdown Item')}</Navbar.Item>
          <Navbar.Item>{NavItemRender('Dropdown Item')}</Navbar.Item>
          <Navbar.DropdownDivider />
          <Navbar.DropdownContentItem>Hello world</Navbar.DropdownContentItem>
        </Navbar.Dropdown>
      </Navbar.Menu>
    </>
  ),
};

function NavItemRender(text: string) {
  const renderer = ({ className }: { className: string }) => {
    return <a className={className}>{text}</a>;
  };
  return renderer;
}
