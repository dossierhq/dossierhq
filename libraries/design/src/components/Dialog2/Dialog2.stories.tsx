import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Button2 } from '../Button2/Button2.js';
import { ButtonDropdown } from '../ButtonDropdown/ButtonDropdown.js';
import { Card } from '../Card/Card.js';
import { FullscreenContainer } from '../FullscreenContainer/FullscreenContainer.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Text } from '../Text/Text.js';
import { Dialog2, type Dialog2Props } from './Dialog2.js';

type StoryProps = Dialog2Props;

const meta = {
  title: 'Components/Dialog2',
  component: Wrapper,
  args: {},
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

function Wrapper({ children, ...args }: StoryProps) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          alignItems: 'center',
          background:
            'repeating-linear-gradient(45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
          width: '300px',
          height: '100vh',
        }}
      >
        <Button2>Unrelated button</Button2>

        <Dialog2.Trigger isOpen={isOpen} onOpenChange={setIsOpen}>
          <Button2 onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Hide' : 'Show'}</Button2>
          <Dialog2 {...args}>{children}</Dialog2>
        </Dialog2.Trigger>

        <ButtonDropdown up items={[{ id: 'one', text: 'One' }]} renderItem={(item) => item.text}>
          Dropdown
        </ButtonDropdown>
      </div>
    </>
  );
}

export const Normal: Story = {
  args: {
    children: ({ close }) => (
      <Card>
        <Card.Header>
          <Card.HeaderTitle>Card title</Card.HeaderTitle>
        </Card.Header>
        <Card.Content>Lorem ipsum</Card.Content>
        <Card.Footer>
          <Card.FooterButton value="cancel" onClick={close}>
            Cancel
          </Card.FooterButton>
          <Card.FooterButton value="save" onClick={close}>
            Save
          </Card.FooterButton>
        </Card.Footer>
      </Card>
    ),
  },
};

export const WideFillHeight: Story = {
  args: {
    width: 'wide',
    height: 'fill',
    children: (
      <FullscreenContainer height="100%" card>
        <FullscreenContainer.Row flexDirection="row" alignItems="center">
          <FullscreenContainer.Item flexGrow={1} paddingHorizontal={3} paddingVertical={2}>
            <Text textStyle="headline5">Header</Text>
          </FullscreenContainer.Item>
          <IconButton icon="close" color="white" />
        </FullscreenContainer.Row>
        <FullscreenContainer.ScrollableRow>
          <div
            style={{
              border: '5px solid burlywood',
              background:
                'repeating-linear-gradient(-45deg, burlywood, burlywood 10px, transparent 10px, transparent 40px)',
              height: '300vh',
            }}
          />
        </FullscreenContainer.ScrollableRow>
      </FullscreenContainer>
    ),
  },
};

export const WithDropdown: Story = {
  args: {
    children: (
      <Card>
        <Card.Header>
          <Card.HeaderTitle>Card title</Card.HeaderTitle>
        </Card.Header>
        <Card.Content>
          <ButtonDropdown
            items={[{ id: '1' }, { id: '2' }, { id: '3' }]}
            renderItem={(item) => `Item ${item.id}`}
          >
            Open dropdown
          </ButtonDropdown>
        </Card.Content>
      </Card>
    ),
  },
};
