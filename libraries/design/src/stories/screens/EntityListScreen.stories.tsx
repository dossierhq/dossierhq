import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useReducer } from 'react';
import {
  Button,
  Columns,
  Container,
  Icon as BulmaIcon,
  Navbar,
  Pagination,
  Tag,
} from 'react-bulma-components';
import {
  Icon,
  IconButton,
  IconImage,
  MultipleSelectorStateActions,
  reduceMultipleSelectorState,
  Table,
} from '../../components';
import type {
  EntityTypeSelectorDispatch,
  EntityTypeSelectorInitArgs,
  EntityTypeSelectorReducer,
  EntityTypeSelectorState,
} from './EntityTypeSelector';
import { EntityTypeSelector, initializeEntityTypeSelectorState } from './EntityTypeSelector';
import type {
  StatusSelectorDispatch,
  StatusSelectorInitArgs,
  StatusSelectorReducer,
  StatusSelectorState,
} from './StatusSelector';
import { initializeStatusSelectorState, StatusSelector } from './StatusSelector';

interface ScreenProps {
  entityCount: number;
  onMapClick: (event: unknown) => void;
  onTableRowClick: (event: unknown) => void;
}

const meta: Meta<ScreenProps> = {
  title: 'Screens/Entity list',
  component: Screen,
  args: {
    entityCount: 50,
  },
  argTypes: { onMapClick: { action: 'clicked' }, onTableRowClick: { action: 'clicked' } },
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template: Story<ScreenProps> = (args) => {
  return <Screen {...args} />;
};

function Screen({ entityCount, onMapClick, onTableRowClick }: ScreenProps): JSX.Element {
  const [entityTypeFilterState, entityTypeFilterDispatch] = useReducer<
    EntityTypeSelectorReducer,
    EntityTypeSelectorInitArgs
  >(
    reduceMultipleSelectorState,
    { selectedIds: ['foo', 'bar'] },
    initializeEntityTypeSelectorState
  );
  const [statusFilterState, statusFilterDispatch] = useReducer<
    StatusSelectorReducer,
    StatusSelectorInitArgs
  >(reduceMultipleSelectorState, { selectedIds: ['published'] }, initializeStatusSelectorState);
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar>
        <Navbar.Brand>
          <Navbar.Item>Data data</Navbar.Item>
        </Navbar.Brand>
        <Navbar.Item>Entities</Navbar.Item>
      </Navbar>
      <Container className="is-flex is-flex-grow-0 pt-2" flexDirection="column">
        <Columns gap={1 as unknown as undefined}>
          <Columns.Column>
            <p className="control has-icons-left">
              <input className="input" type="text" placeholder="Search" />
              <BulmaIcon size="small" align="left">
                <IconImage icon="search" />
              </BulmaIcon>
            </p>
          </Columns.Column>
          <Columns.Column narrow>
            <EntityTypeSelector
              label="Entity type"
              state={entityTypeFilterState}
              dispatch={entityTypeFilterDispatch}
            />
          </Columns.Column>
          <Columns.Column narrow>
            <StatusSelector
              label="Status"
              state={statusFilterState}
              dispatch={statusFilterDispatch}
            />
          </Columns.Column>
          <Columns.Column narrow>
            <IconButton icon="map" onClick={onMapClick} />
          </Columns.Column>
          <Columns.Column narrow>
            <Button>
              <BulmaIcon size="small">
                <IconImage icon="add" />
              </BulmaIcon>
              <span>Create</span>
              <BulmaIcon size="small">
                <IconImage icon="chevronDown" />
              </BulmaIcon>
            </Button>
          </Columns.Column>
        </Columns>
      </Container>
      <div style={{ overflowY: 'scroll', flexGrow: 1, height: '0' }}>
        <Container className="is-flex" flexDirection="column">
          <EntityTypesList state={entityTypeFilterState} dispatch={entityTypeFilterDispatch} />
          <StatusTagList state={statusFilterState} dispatch={statusFilterDispatch} />
          <Table>
            <Table.Head>
              <Table.Row sticky>
                <Table.Header order="asc">Name</Table.Header>
                <Table.Header order="">Entity type</Table.Header>
                <Table.Header narrow>Status</Table.Header>
                <Table.Header narrow order="">
                  Created
                </Table.Header>
                <Table.Header narrow order="">
                  Updated
                </Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {[...Array(entityCount).keys()].map((_, index) => (
                <Table.Row key={index} clickable onClick={onTableRowClick}>
                  <Table.Cell>Hello</Table.Cell>
                  <Table.Cell>BlogPost</Table.Cell>
                  <Table.Cell narrow>
                    <Tag color="success">Published</Tag>
                  </Table.Cell>
                  <Table.Cell narrow>Today</Table.Cell>
                  <Table.Cell narrow>Today</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Container>
      </div>
      <Container className="is-flex-grow-0">
        <Pagination current={3} showFirstLast total={5} />
      </Container>
    </div>
  );
}

function EntityTypesList({
  state,
  dispatch,
}: {
  state: EntityTypeSelectorState;
  dispatch: EntityTypeSelectorDispatch;
}) {
  const { items, selectedIds } = state;
  if (selectedIds.length === 0) {
    return null;
  }

  const types = items.filter(({ id }) => selectedIds.includes(id));
  return (
    <>
      <p className="is-size-7 has-text-weight-semibold">Show entity types:</p>
      <div className="field is-grouped">
        {types.map(({ id, name }) => (
          <div key={id} className="control">
            <Tag.Group hasAddons>
              <Tag>{name}</Tag>
              <Tag
                className="is-clickable"
                remove
                onClick={() => dispatch(new MultipleSelectorStateActions.ToggleItem(id))}
              />
            </Tag.Group>
          </div>
        ))}
        <Tag.Group>
          <Tag
            className="is-clickable"
            color="white"
            onClick={() => dispatch(new MultipleSelectorStateActions.ClearSelection())}
          >
            Clear
          </Tag>
        </Tag.Group>
      </div>
    </>
  );
}

function StatusTagList({
  state,
  dispatch,
}: {
  state: StatusSelectorState;
  dispatch: StatusSelectorDispatch;
}) {
  const { items, selectedIds } = state;
  if (selectedIds.length === 0) {
    return null;
  }

  const statuses = items.filter(({ id }) => selectedIds.includes(id));
  return (
    <>
      <p className="is-size-7 has-text-weight-semibold">Show entities with status:</p>
      <div className="field is-grouped">
        {statuses.map(({ id, name, color }) => (
          <div key={id} className="control">
            <Tag.Group hasAddons>
              <Tag color={color}>{name}</Tag>
              <Tag
                className="is-clickable"
                remove
                onClick={() => dispatch(new MultipleSelectorStateActions.ToggleItem(id))}
              />
            </Tag.Group>
          </div>
        ))}
        <Tag.Group>
          <Tag
            className="is-clickable"
            color="white"
            onClick={() => dispatch(new MultipleSelectorStateActions.ClearSelection())}
          >
            Clear
          </Tag>
        </Tag.Group>
      </div>
    </>
  );
}

export const Normal = Template.bind({});

export const Empty = Template.bind({});
Empty.args = {
  entityCount: 0,
};
