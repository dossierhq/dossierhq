import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { fn } from 'storybook/test';
import { ThemeProvider } from '../components/ThemeProvider.js';
import { StoryDossierProvider } from '../stories/StoryDossierProvider.js';
import { PublishedContentListScreen } from './PublishedContentListScreen.js';

function Wrapper(props: ComponentProps<typeof PublishedContentListScreen>) {
  return (
    <ThemeProvider>
      <StoryDossierProvider>
        <PublishedContentListScreen {...props} />
      </StoryDossierProvider>
    </ThemeProvider>
  );
}

const meta: Meta<typeof Wrapper> = {
  title: 'Screens/PublishedContentListScreen',
  component: Wrapper,
  args: {
    urlSearchParams: new URLSearchParams(),
    onUrlSearchParamsChange: fn(),
    onOpenEntity: fn(),
  },
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
