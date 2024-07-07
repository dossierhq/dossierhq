import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import type { ComponentProps } from 'react';
import { ThemeProvider } from '../components/ThemeProvider.js';
import { StoryDossierProvider } from '../stories/StoryDossierProvider.js';
import { ContentListScreen } from './ContentListScreen.js';

function Wrapper(props: ComponentProps<typeof ContentListScreen>) {
  return (
    <ThemeProvider>
      <StoryDossierProvider>
        <ContentListScreen {...props} />
      </StoryDossierProvider>
    </ThemeProvider>
  );
}

const meta = {
  title: 'Screens/ContentListScreen',
  component: Wrapper,
  args: { onOpenEntity: fn(), onCreateEntity: fn(), onUrlSearchParamsChange: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
