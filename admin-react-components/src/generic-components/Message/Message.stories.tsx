import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { MessageProps } from './Message';
import { Message } from './Message';

const meta: Meta<MessageProps> = {
  title: 'Generic/Message',
  component: Message,
};
export default meta;

const Template: Story<MessageProps> = (args) => {
  if (!('onDismiss' in args)) {
    // Default to having a onDismiss for dismiss icon to show up for storyshots
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    args.onDismiss = () => {};
  }
  return <Message {...args} />;
};

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer volutpat ante sem, quis aliquet urna consectetur ut. In elit erat, ultrices id tellus nec, efficitur tempor ipsum. Fusce sit amet nisl a ex feugiat auctor in id nunc.';

export const Normal = Template.bind({});
Normal.args = {
  title: 'Title',
  message: loremIpsum,
};

export const NormalTitle = Template.bind({});
NormalTitle.args = { title: 'Title' };

export const NormalMessage = Template.bind({});
NormalMessage.args = {
  message: loremIpsum,
};

export const NormalNoOnDismiss = Template.bind({});
NormalNoOnDismiss.args = {
  title: 'Title',
  message: loremIpsum,
  onDismiss: undefined,
};

export const Primary = Template.bind({});
Primary.args = {
  kind: 'primary',
  title: 'Title',
  message: loremIpsum,
};

export const Danger = Template.bind({});
Danger.args = {
  kind: 'danger',
  title: 'Title',
  message: loremIpsum,
};
