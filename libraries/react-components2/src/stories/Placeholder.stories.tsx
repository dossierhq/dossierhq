import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from '../components/ui/button';
import { useSchema } from '../hooks/useSchema';
import { StoryDossierProvider } from './StoryDossierProvider';

function Placeholder({ onClick }: { onClick: () => void }) {
  return (
    <StoryDossierProvider>
      <Button onClick={onClick}>Placeholder</Button>
      <Inner />
    </StoryDossierProvider>
  );
}

function Inner() {
  const { schema } = useSchema();
  return <div>{JSON.stringify(schema)}</div>;
}

const meta = {
  title: 'Placeholder',
  component: Placeholder,
  args: { onClick: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Placeholder>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
