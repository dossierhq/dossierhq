import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React, { useState } from 'react';
import { Button } from '../Button/Button.js';
import { Card } from '../Card/Card.js';
import { ButtonDropdown } from '../ButtonDropdown/ButtonDropdown.js';
import type { DialogProps } from './Dialog.js';
import { Dialog } from './Dialog.js';

type StoryProps = Omit<DialogProps, 'show'>;

const meta: Meta<StoryProps> = {
  title: 'Components/Dialog',
  component: Dialog,
  args: {
    modal: true,
  },
  parameters: { layout: 'centered' },
};
export default meta;

const Template: Story<StoryProps> = (args) => {
  return <Wrapper {...args} />;
};

function Wrapper({ children, onClose, ...args }: StoryProps) {
  const [show, setShow] = useState(false);
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

export const Normal = Template.bind({});
Normal.args = {
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
};

export const NonModal = Template.bind({});
NonModal.args = {
  modal: false,
  children: <p>Hello</p>,
};
