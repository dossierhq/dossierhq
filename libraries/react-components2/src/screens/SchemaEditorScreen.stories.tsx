import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { fn, userEvent, within } from 'storybook/test';
import { ThemeProvider } from '../components/ThemeProvider.js';
import { StoryDossierProvider } from '../stories/StoryDossierProvider.js';
import { SchemaEditorScreen } from './SchemaEditorScreen.js';

function Wrapper(props: ComponentProps<typeof SchemaEditorScreen>) {
  return (
    <ThemeProvider>
      <StoryDossierProvider>
        <SchemaEditorScreen {...props} />
      </StoryDossierProvider>
    </ThemeProvider>
  );
}

const meta: Meta<typeof Wrapper> = {
  title: 'Screens/SchemaEditorScreen',
  component: Wrapper,
  args: { onEditorHasChangesChange: fn() },
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const OpenStringsEntity: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const menuItems = await canvas.findAllByText('StringsEntity');
    await userEvent.click(menuItems[0]);
  },
};
