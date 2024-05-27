import { NotificationContainer, Row } from '@dossierhq/design';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ContentEditorScreen } from '../screens/ContentEditorScreen/ContentEditorScreen';
import { SchemaEditorScreen } from '../screens/SchemaEditorScreen/SchemaEditorScreen';
import { AdminLoadContextProvider } from '../test/AdminLoadContextProvider';

function Combo({
  onEntityEditorHasChangesChange,
  onSchemaEditorHasChangesChange,
}: {
  onEntityEditorHasChangesChange: (hasChanges: boolean) => void;
  onSchemaEditorHasChangesChange: (hasChanges: boolean) => void;
}) {
  return (
    <Row style={{ height: '100%' }}>
      <div style={{ width: '50%', height: '100%', borderRight: '1px solid black' }}>
        <ContentEditorScreen onEditorHasChangesChange={onEntityEditorHasChangesChange} />
      </div>
      <div style={{ width: '50%', height: '100%' }}>
        <SchemaEditorScreen onEditorHasChangesChange={onSchemaEditorHasChangesChange} />
      </div>
    </Row>
  );
}

const meta: Meta<typeof Combo> = {
  title: 'Combo/ContentEditor and SchemaEditor',
  component: Combo,
  args: { onEntityEditorHasChangesChange: fn(), onSchemaEditorHasChangesChange: fn() },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <AdminLoadContextProvider>
        <NotificationContainer>
          <Story />
        </NotificationContainer>
      </AdminLoadContextProvider>
    ),
  ],
} satisfies Meta<typeof Combo>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
