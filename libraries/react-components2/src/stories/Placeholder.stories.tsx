import { Button } from '@/components/ui/button';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

function Placeholder({ onClick }: { onClick: () => void }) {
  return (
    <div>
      <Button onClick={onClick}>Placeholder</Button>
    </div>
  );
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
