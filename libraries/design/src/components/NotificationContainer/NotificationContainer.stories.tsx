import type { Meta, StoryObj } from '@storybook/react';
import React, { useContext, useRef } from 'react';
import { NotificationContext } from '../../contexts/NotificationContext.js';
import { Button } from '../Button/Button.js';
import { ButtonDropdown } from '../ButtonDropdown/ButtonDropdown.js';
import { Column } from '../Column/Column.js';
import { Scrollable } from '../Scrollable/Scrollable.js';
import { NotificationContainer } from './NotificationContainer.js';

const meta = {
  title: 'Components/NotificationContainer',
  component: NotificationContainer,
  tags: ['autodocs'],
} satisfies Meta<typeof NotificationContainer>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    children: (
      <Column>
        <Column.Item>
          <ShowNotificationButton />
        </Column.Item>
        <Column.Item style={{ maxWidth: '150px', marginLeft: 'auto', marginRight: 'auto' }}>
          <Scrollable>
            <div
              style={{
                backgroundColor: 'gainsboro',
                zIndex: 1,
                height: '50px',
                textAlign: 'center',
              }}
            >
              z-index 1
            </div>
            <div
              style={{
                backgroundColor: 'lightgoldenrodyellow',
                zIndex: 100,
                height: '50px',
                textAlign: 'center',
              }}
            >
              z-index 100
            </div>
            <ButtonDropdown
              up
              items={[{ id: 'one', text: 'One' }]}
              renderItem={(item) => item.text}
            >
              Dropdown
            </ButtonDropdown>
          </Scrollable>
        </Column.Item>
      </Column>
    ),
  },
};

function ShowNotificationButton() {
  const countRef = useRef(0);
  const { showNotification } = useContext(NotificationContext);
  return (
    <>
      <Button
        onClick={() =>
          showNotification({
            color: 'success',
            message: `Notification message: ${countRef.current++}`,
          })
        }
      >
        Show success
      </Button>
      <Button
        onClick={() =>
          showNotification({
            color: 'error',
            message: `Notification message: ${countRef.current++}`,
          })
        }
      >
        Show error
      </Button>
    </>
  );
}
