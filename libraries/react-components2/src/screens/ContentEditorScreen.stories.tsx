import type { Meta, StoryObj } from '@storybook/react';
import { StoryDossierProvider } from '../stories/StoryDossierProvider.js';
import { ContentEditorScreen } from './ContentEditorScreen.js';

function Wrapper() {
  return (
    <StoryDossierProvider>
      <ContentEditorScreen />
    </StoryDossierProvider>
  );
}

const meta = {
  title: 'Screens/ContentEditorScreen',
  component: Wrapper,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
