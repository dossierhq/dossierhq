import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
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
    onUrlSearchParamsChange: fn(),
    onEditorHasChangesChange: fn(),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Wrapper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const OneOpen: Story = {
  args: {
    urlSearchParams: urlFor(['a94c056e-7ae4-563c-a8d7-dd7ac41f7929']),
  },
};

function urlFor(ids: string[]) {
  return new URLSearchParams(ids.map((id) => ['id', id]));
}
