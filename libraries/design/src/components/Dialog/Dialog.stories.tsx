import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Button } from '../Button/Button.js';
import { ButtonDropdown } from '../ButtonDropdown/ButtonDropdown.js';
import { Card } from '../Card/Card.js';
import { FullscreenContainer } from '../FullscreenContainer/FullscreenContainer.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Text } from '../Text/Text.js';
import type { DialogProps } from './Dialog.js';
import { Dialog } from './Dialog.js';

type StoryProps = Omit<DialogProps, 'show'>;

const meta = {
  title: 'Components/Dialog',
  component: Wrapper,
  args: {
    form: true,
    modal: true,
  },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

function Wrapper({ children, onClose, ...args }: StoryProps) {
  const [show, setShow] = useState(true);
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
        <Button>Unrelated button</Button>
        <Button onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</Button>
        <ButtonDropdown up items={[{ id: 'one', text: 'One' }]} renderItem={(item) => item.text}>
          Dropdown
        </ButtonDropdown>
      </div>
      <Dialog
        show={show}
        onClose={(...args) => {
          setShow(false);
          onClose?.(...args);
        }}
        {...args}
      >
        {children}
      </Dialog>
    </>
  );
}

export const Normal: Story = {
  args: {
    children: (
      <Card>
        <Card.Header>
          <Card.HeaderTitle>Card title</Card.HeaderTitle>
        </Card.Header>
        <Card.Content>Lorem ipsum</Card.Content>
        <Card.Footer>
          <Card.FooterButton value="cancel">Cancel</Card.FooterButton>
          <Card.FooterButton value="save">Save</Card.FooterButton>
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
    form: false,
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

export const NonModal: Story = {
  args: {
    modal: false,
    children: <p>Hello</p>,
  },
};
