import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React from 'react';
import { Text } from '../Text/Text.js';
import type { CardProps } from './Card2.js';
import { Card2 } from './Card2.js';

const meta: Meta<CardProps> = {
  title: 'Components/Card2',
  component: Card2,
  parameters: { layout: 'centered' },
};
export default meta;

const Template: Story<CardProps> = (args) => {
  return <Card2 {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <>
      <Card2.Header noIcons>
        <Card2.HeaderTitle>Header</Card2.HeaderTitle>
      </Card2.Header>
      <Card2.Content>Content</Card2.Content>
      <Card2.Footer>
        <Card2.FooterItem>First</Card2.FooterItem>
        <Card2.FooterItem>
          <a>Second footer</a>
        </Card2.FooterItem>
      </Card2.Footer>
    </>
  ),
};

export const HeaderTags = Template.bind({});
HeaderTags.args = {
  children: (
    <>
      <Card2.Header noIcons>
        <Card2.HeaderTitle>Title</Card2.HeaderTitle>
        <Card2.HeaderTag>one</Card2.HeaderTag>
        <Card2.HeaderTag>two</Card2.HeaderTag>
      </Card2.Header>
      <Card2.Content>Content</Card2.Content>
    </>
  ),
};

export const HeaderTagsAndIconButton = Template.bind({});
HeaderTagsAndIconButton.args = {
  children: (
    <>
      <Card2.Header>
        <Card2.HeaderTitle>Title</Card2.HeaderTitle>
        <Card2.HeaderTag>one</Card2.HeaderTag>
        <Card2.HeaderTag>two</Card2.HeaderTag>
        <Card2.HeaderIconButton icon="close" />
      </Card2.Header>
      <Card2.Content>Content</Card2.Content>
    </>
  ),
};

export const TwoParagraphsInContent = Template.bind({});
TwoParagraphsInContent.args = {
  children: (
    <>
      <Card2.Header noIcons>
        <Card2.HeaderTitle>Header</Card2.HeaderTitle>
      </Card2.Header>
      <Card2.Content>
        <Text textStyle="body1">First paragraph</Text>
        <Text textStyle="body2">Second paragraph</Text>
      </Card2.Content>
      <Card2.Footer>
        <Card2.FooterItem>First</Card2.FooterItem>
        <Card2.FooterItem>
          <a>Second footer</a>
        </Card2.FooterItem>
      </Card2.Footer>
    </>
  ),
};

export const NoPaddingContent = Template.bind({});
NoPaddingContent.args = {
  children: (
    <>
      <Card2.Header noIcons>
        <Card2.HeaderTitle>Header</Card2.HeaderTitle>
      </Card2.Header>
      <Card2.Content noPadding>
        <div style={{ backgroundColor: '#ccc', height: '10rem' }} />
      </Card2.Content>
    </>
  ),
};

export const FooterButtons = Template.bind({});
FooterButtons.args = {
  children: (
    <>
      <Card2.Header noIcons>
        <Card2.HeaderTitle>Header</Card2.HeaderTitle>
      </Card2.Header>
      <Card2.Content>Content</Card2.Content>
      <Card2.Footer>
        <Card2.FooterButton>First</Card2.FooterButton>
        <Card2.FooterButton>Second button</Card2.FooterButton>
      </Card2.Footer>
    </>
  ),
};

export const Dropdown = Template.bind({});
Dropdown.args = {
  children: (
    <>
      <Card2.Header>
        <Card2.HeaderTitle>Header</Card2.HeaderTitle>
        <Card2.HeaderDropdown
          items={[
            { id: '1', title: 'One' },
            { id: '2', title: 'Two' },
            { id: '3', title: 'Three' },
          ]}
          renderItem={(item) => item.title}
          onItemClick={console.log}
        />
      </Card2.Header>
      <Card2.Content>Content</Card2.Content>
    </>
  ),
};

export const CloseButton = Template.bind({});
CloseButton.args = {
  children: (
    <>
      <Card2.Header>
        <Card2.HeaderTitle>Header</Card2.HeaderTitle>
        <Card2.HeaderIconButton icon="close" onClick={console.log} />
      </Card2.Header>
      <Card2.Content>Content</Card2.Content>
    </>
  ),
};
