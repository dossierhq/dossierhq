import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React, { useRef, useState } from 'react';
import { Button } from '../Button/Button.js';
import type { DropdownDisplayProps } from './DropdownDisplay.js';
import { DropdownDisplay } from './DropdownDisplay.js';

const meta: Meta<DropdownDisplayProps> = {
  title: 'Components/DropdownDisplay',
  component: DropdownDisplay,
  args: {},
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};
export default meta;

const Template: Story<DropdownDisplayProps> = (args) => {
  return <Wrapper {...args} />;
};

function Wrapper({ up, left, children }: DropdownDisplayProps) {
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

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <>
      <DropdownDisplay.Item active>One</DropdownDisplay.Item>
      <DropdownDisplay.Item>Two</DropdownDisplay.Item>
      <DropdownDisplay.Item>Three</DropdownDisplay.Item>
    </>
  ),
};

export const UpLeft = Template.bind({});
UpLeft.args = {
  up: true,
  left: true,
  children: (
    <>
      <DropdownDisplay.Item active>One</DropdownDisplay.Item>
      <DropdownDisplay.Item>Two</DropdownDisplay.Item>
      <DropdownDisplay.Item>Three</DropdownDisplay.Item>
    </>
  ),
};

export const ContentItem = Template.bind({});
ContentItem.args = {
  children: (
    <>
      <DropdownDisplay.Item active>One</DropdownDisplay.Item>
      <DropdownDisplay.ContentItem>Content</DropdownDisplay.ContentItem>
      <DropdownDisplay.Item>Three</DropdownDisplay.Item>
    </>
  ),
};

export const OneHundredItems = Template.bind({});
OneHundredItems.args = {
  children: (() => (
    <>
      {Array.from(Array(100).keys()).map((item) => (
        <DropdownDisplay.Item key={item}>Item: {item}</DropdownDisplay.Item>
      ))}
    </>
  ))(),
};
