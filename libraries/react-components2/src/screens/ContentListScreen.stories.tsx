import type { Meta, StoryObj } from '@storybook/react';
import { StoryDossierProvider } from '../stories/StoryDossierProvider';
import { ContentListScreen } from './ContentListScreen';

function Placeholder() {
  return (
    <StoryDossierProvider>
      <ContentListScreen />
    </StoryDossierProvider>
  );
}

const meta = {
  title: 'Screens/ContentListScreen',
  component: Placeholder,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Placeholder>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
