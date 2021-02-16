import type { Story } from '@storybook/react/types-6-0';
import React from 'react';
import type { MessageProps } from './Message';
import { Message } from './Message';

export default {
  title: 'Generic/Message',
  component: Message,
};

const Template: Story<MessageProps> = (args) => {
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
