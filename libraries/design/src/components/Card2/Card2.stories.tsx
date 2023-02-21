import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { toSizeClassName } from '../../utils/LayoutPropsUtils.js';
import { Text } from '../Text/Text.js';
import { Card2 } from './Card2.js';

const meta = {
  title: 'Components/Card2',
  component: Card2,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Card2>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
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
  },
};

export const HeaderTags: Story = {
  args: {
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
  },
};

export const HeaderTagsAndIconButton: Story = {
  args: {
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
  },
};

export const TwoParagraphsInContent: Story = {
  args: {
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
  },
};

export const NoPaddingContent: Story = {
  args: {
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
  },
};

export const FooterButtons: Story = {
  args: {
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
  },
};

export const Dropdown: Story = {
  args: {
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
  },
};

export const CloseButton: Story = {
  args: {
    children: (
      <>
        <Card2.Header>
          <Card2.HeaderTitle>Header</Card2.HeaderTitle>
          <Card2.HeaderIconButton icon="close" onClick={console.log} />
        </Card2.Header>
        <Card2.Content>Content</Card2.Content>
      </>
    ),
  },
};

export const Media: Story = {
  args: {
    children: (
      <>
        <Card2.Media>
          <div
            className={toSizeClassName({ aspectRatio: '16/9' })}
            style={{ backgroundColor: '#ccc', width: '100%' }}
          />
        </Card2.Media>
        <Card2.Content>Lorem ipsum lorem ipsum</Card2.Content>
      </>
    ),
  },
};
