import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { StoryDossierProvider } from '../stories/StoryDossierProvider.js';
import { ContentEditorScreen } from './ContentEditorScreen.js';

function Wrapper(props: ComponentProps<typeof ContentEditorScreen>) {
  return (
    <StoryDossierProvider>
      <ContentEditorScreen {...props} />
    </StoryDossierProvider>
  );
}

const meta = {
  title: 'Screens/ContentEditorScreen',
  component: Wrapper,
  args: {
    urlSearchParams: new URLSearchParams(),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const OneOpen: Story = {
  args: {
    urlSearchParams: urlFor(['1344d8d8-079d-5175-b9af-400c2e4c786a']),
  },
};

function urlFor(ids: string[]) {
  return new URLSearchParams(ids.map((id) => ['id', id]));
}
