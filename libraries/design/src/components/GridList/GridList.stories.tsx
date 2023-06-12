import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { useListData } from 'react-stately';
import {
  GridList,
  GridListDragHandle,
  GridListItem,
  useDragAndDrop,
  type GridListProps,
} from './GridList.js';

interface Item {
  id: string;
  title: string;
}

type StoryProps = Omit<GridListProps<Item>, 'dragAndDropHooks'> & { reorderable?: boolean };

const meta = {
  title: 'Components/GridList',
  component: Wrapper,
  args: {
    'aria-label': 'Grid list',
    items: [
      { id: '1', title: 'Item 1' },
      { id: '2', title: 'Item 2' },
      { id: '3', title: 'Item 3' },
    ],
    children: (item) => (
      <GridListItem key={item.id} id={item.id} textValue={item.title} marginVertical={1}>
        {({ allowsDragging }) => (
          <div>
            {allowsDragging ? <GridListDragHandle /> : null}
            {item.title}
          </div>
        )}
      </GridListItem>
    ),
  },
  tags: ['autodocs'],
} satisfies Meta<StoryProps>;
export default meta;

type Story = StoryObj<typeof meta>;

function Wrapper({ items: initialItems, reorderable, ...props }: StoryProps) {
  const list = useListData({ initialItems: initialItems ? [...initialItems] : [] });
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': list.getItem(key).title })),
    onReorder(e) {
      if (e.target.dropPosition === 'before') {
        list.moveBefore(e.target.key, e.keys);
      } else if (e.target.dropPosition === 'after') {
        list.moveAfter(e.target.key, e.keys);
      }
    },
  });
  return (
    <GridList
      items={list.items}
      dragAndDropHooks={reorderable ? dragAndDropHooks : undefined}
      {...props}
    />
  );
}

export const Normal: Story = { args: {} };

export const Reorderable: Story = { args: { reorderable: true } };
