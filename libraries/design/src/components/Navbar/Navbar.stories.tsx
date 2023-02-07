import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Navbar } from './Navbar.js';

const meta = {
  title: 'Components/Navbar',
  component: Navbar,
  args: {},
  tags: ['autodocs'],
} satisfies Meta<typeof Navbar>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
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
  },
};

export const Active: Story = {
  args: {
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
  },
};

export const Dropdown: Story = {
  args: {
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
  },
};

function NavItemRender(text: string) {
  const renderer = ({ className }: { className: string }) => {
    return <a className={className}>{text}</a>;
  };
  return renderer;
}
