import type { Meta, Story } from '@storybook/react/types-6-0.js';
import React, { useContext } from 'react';
import { NotificationContext } from '../../contexts/NotificationContext.js';
import { Button } from '../Button/Button.js';
import { Column } from '../Column/Column.js';
import { Dropdown } from '../Dropdown/Dropdown.js';
import { Scrollable } from '../Scrollable/Scrollable.js';
import type { NotificationContainerProps } from './NotificationContainer.js';
import { NotificationContainer } from './NotificationContainer.js';

const meta: Meta<NotificationContainerProps> = {
  title: 'Components/NotificationContainer',
  component: NotificationContainer,
};
export default meta;

const Template: Story<NotificationContainerProps> = (args) => {
  return <NotificationContainer {...args} />;
};

export const Normal = Template.bind({});
Normal.args = {
  children: (
    <Column>
      <Column.Item>
        <ShowNotificationButton />
      </Column.Item>
      <Column.Item style={{ maxWidth: '150px', marginLeft: 'auto', marginRight: 'auto' }}>
        <Scrollable>
          <div
            style={{ backgroundColor: 'gainsboro', zIndex: 1, height: '50px', textAlign: 'center' }}
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
          <Dropdown up items={[{ id: 'one', text: 'One' }]} renderItem={(item) => item.text}>
            Dropdown
          </Dropdown>
        </Scrollable>
      </Column.Item>
    </Column>
  ),
};

function ShowNotificationButton() {
  const { showNotification } = useContext(NotificationContext);
  return (
    <>
      <Button
        onClick={() => showNotification({ color: 'success', message: 'Notification message' })}
      >
        Show success
      </Button>
      <Button onClick={() => showNotification({ color: 'error', message: 'Notification message' })}>
        Show error
      </Button>
    </>
  );
}
