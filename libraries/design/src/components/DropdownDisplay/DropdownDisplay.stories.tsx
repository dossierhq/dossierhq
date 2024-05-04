import type { Meta, StoryObj } from '@storybook/react';
import React, { useRef, useState } from 'react';
import { Button } from '../Button/Button.js';
import { DropdownDisplay, type DropdownDisplayProps } from './DropdownDisplay.js';

type WrapperProps = Omit<DropdownDisplayProps, 'trigger' | 'triggerRef'>;

const meta = {
  title: 'Components/DropdownDisplay',
  component: Wrapper,
  args: {},
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

function Wrapper({ up, left, children }: WrapperProps) {
  const [active, setActive] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <DropdownDisplay
      active={active}
      trigger={
        <Button
          ref={triggerRef}
          iconRight={up ? 'chevronUp' : 'chevronDown'}
          onMouseDown={() => setActive(!active)}
        >
          Drop down
        </Button>
      }
      triggerRef={triggerRef}
      {...{ up, left }}
    >
      {children}
    </DropdownDisplay>
  );
}

export const Normal: Story = {
  args: {
    children: (
      <>
        <DropdownDisplay.Item active>One</DropdownDisplay.Item>
        <DropdownDisplay.Item>Two</DropdownDisplay.Item>
        <DropdownDisplay.Item>Three</DropdownDisplay.Item>
      </>
    ),
  },
};

export const UpLeft: Story = {
  args: {
    up: true,
    left: true,
    children: (
      <>
        <DropdownDisplay.Item active>One</DropdownDisplay.Item>
        <DropdownDisplay.Item>Two</DropdownDisplay.Item>
        <DropdownDisplay.Item>Three</DropdownDisplay.Item>
      </>
    ),
  },
};

export const ContentItem: Story = {
  args: {
    children: (
      <>
        <DropdownDisplay.Item active>One</DropdownDisplay.Item>
        <DropdownDisplay.ContentItem>Content</DropdownDisplay.ContentItem>
        <DropdownDisplay.Item>Three</DropdownDisplay.Item>
      </>
    ),
  },
};

export const OneHundredItems: Story = {
  args: {
    children: (() => (
      <>
        {Array.from(Array(100).keys()).map((item) => (
          <DropdownDisplay.Item key={item}>Item: {item}</DropdownDisplay.Item>
        ))}
      </>
    ))(),
  },
};
