import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import type { MessageProps } from './Message.js';
import { Message } from './Message.js';

const meta: Meta<MessageProps> = {
  title: 'Components/Message',
  component: Message,
  args: {
    children: (
      <>
        <Message.Header>
          <Message.HeaderTitle>Header</Message.HeaderTitle>
        </Message.Header>
        <Message.Body>
          Body with <strong>strong</strong> and <i>italic</i>
        </Message.Body>
      </>
    ),
  },
  parameters: { layout: 'centered' },
};
export default meta;

const Template: Story<MessageProps> = (args) => {
  return <Message {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {};

export const NoHeader = Template.bind({});
NoHeader.args = {
  children: (
    <>
      <Message.Body>Body</Message.Body>
    </>
  ),
};

export const Warning = Template.bind({});
Warning.args = { color: 'warning' };

export const Danger = Template.bind({});
Danger.args = { color: 'danger' };

export const FlexBodyTwoChildren = Template.bind({});
FlexBodyTwoChildren.args = {
  children: (
    <Message.Body>
      <div style={{ width: '100px', height: '100px', backgroundColor: 'palevioletred' }} />
      <div style={{ width: '100px', height: '100px', backgroundColor: 'olivedrab' }} />
    </Message.Body>
  ),
};

export const FlexBodyNoPadding = Template.bind({});
FlexBodyNoPadding.args = {
  children: (
    <Message.FlexBody padding={0}>
      <div style={{ width: '100px', height: '100px', backgroundColor: 'palevioletred' }} />
      <div style={{ width: '100px', height: '100px', backgroundColor: 'olivedrab' }} />
    </Message.FlexBody>
  ),
};
