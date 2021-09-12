import type { Meta, Story } from '@storybook/react/types-6-0';
import React, { useReducer } from 'react';
import {
  Button,
  Columns,
  Container,
  Icon,
  Navbar,
  Pagination,
  Table,
  Tag,
} from 'react-bulma-components';
import {
  IconImage,
  MultipleSelectorStateActions,
  reduceMultipleSelectorState,
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
  children: JSX.Element | JSX.Element[];
}

function Screen({ children }: ScreenProps): JSX.Element {
  return <>{children}</>;
}

const meta: Meta<ScreenProps> = {
  title: 'Screens/Entity list',
  component: Screen,
  args: {},
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template: Story<ScreenProps> = (args) => {
  return (
    <Screen {...args}>
      <Wrapper />
    </Screen>
  );
};

function Wrapper() {
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
              <Icon size="small" align="left">
                <IconImage icon="search" />
              </Icon>
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
            <Button>
              <Icon size="small" align="left">
                <IconImage icon="map" />
              </Icon>
            </Button>
          </Columns.Column>
          <Columns.Column narrow>
            <Button>
              <Icon size="small">
                <IconImage icon="add" />
              </Icon>
              <span>Create</span>
              <Icon size="small">
                <IconImage icon="chevronDown" />
              </Icon>
            </Button>
          </Columns.Column>
        </Columns>
      </Container>
      <div style={{ overflowY: 'scroll', flexGrow: 1, height: '0' }}>
        <Container className="is-flex" flexDirection="column">
          <EntityTypesList state={entityTypeFilterState} dispatch={entityTypeFilterDispatch} />
          <StatusTagList state={statusFilterState} dispatch={statusFilterDispatch} />
          <Table size="fullwidth" hoverable>
            <thead>
              <tr className="sticky-row has-background-white">
                <OrderByHeader active="down">Name</OrderByHeader>
                <OrderByHeader active="up">Entity type</OrderByHeader>
                <th className="is-narrow">Status</th>
                <OrderByHeader className="is-narrow" active="up">
                  Created
                </OrderByHeader>
                <OrderByHeader className="is-narrow">Updated</OrderByHeader>
              </tr>
            </thead>
            <tbody>
              {[...Array(50).keys()].map((_, index) => (
                <tr key={index} className="is-clickable">
                  <td>Hello</td>
                  <td>BlogPost</td>
                  <td className="is-narrow">
                    <Tag color="success">Published</Tag>
                  </td>
                  <td className="is-narrow">Today</td>
                  <td className="is-narrow">Today</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Container>
      </div>
      <Container className="is-flex-grow-0">
        <Pagination current={3} showFirstLast total={5} />
      </Container>
    </div>
  );
}

function OrderByHeader({
  className,
  active,
  children,
}: {
  className?: string;
  active?: 'up' | 'down';
  children: React.ReactNode;
}) {
  return (
    <th className={`is-clickable order-header ${className ?? ''}`}>
      {children}
      <span className="icon-text">
        <Icon>
          {active ? <IconImage icon={active === 'down' ? 'orderDown' : 'orderUp'} /> : null}
        </Icon>
      </span>
    </th>
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
