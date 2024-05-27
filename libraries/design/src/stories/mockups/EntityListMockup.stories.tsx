import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useReducer, useState, type MouseEvent } from 'react';
import { ButtonDropdown } from '../../components/ButtonDropdown/ButtonDropdown.js';
import { reduceMultipleSelectorState } from '../../components/DropdownSelector/MultipleSelectorReducer.js';
import { Field } from '../../components/Field/Field.js';
import { FullscreenContainer } from '../../components/FullscreenContainer/FullscreenContainer.js';
import { IconButton } from '../../components/IconButton/IconButton.js';
import { Input } from '../../components/Input/Input.js';
import { Navbar } from '../../components/Navbar/Navbar.js';
import { Table } from '../../components/Table/Table.js';
import { Tag } from '../../components/Tag/Tag.js';
import { TagSelector } from '../../components/TagSelector/TagSelector.js';
import {
  AuthKeySelector,
  initializeAuthKeySelectorState,
  type AuthKeySelectorDispatch,
  type AuthKeySelectorInitArgs,
  type AuthKeySelectorReducer,
  type AuthKeySelectorState,
} from './AuthKeySelector.js';
import { AuthKeyTagList } from './AuthKeyTagList.js';
import {
  EntityTypeSelector,
  initializeEntityTypeSelectorState,
  reduceEntityTypeSelectorState,
  type EntityTypeSelectorDispatch,
  type EntityTypeSelectorState,
} from './EntityTypeSelector.js';
import {
  initializeStatusSelectorState,
  StatusSelector,
  type StatusSelectorDispatch,
  type StatusSelectorInitArgs,
  type StatusSelectorReducer,
  type StatusSelectorState,
} from './StatusSelector.js';
import { StatusTagList } from './StatusTagList';

interface ScreenProps {
  entityCount: number;
  onMapClick: (event: MouseEvent) => void;
  onCreateClick: (item: { id: string; name: string }) => void;
  onTableRowClick: (event: MouseEvent) => void;
}

const meta = {
  title: 'Mockups/Entity list',
  component: Screen,
  args: {
    entityCount: 50,
    onCreateClick: fn(),
    onMapClick: fn(),
    onTableRowClick: fn(),
  },
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Screen>;
export default meta;

type Story = StoryObj<typeof meta>;

function Screen({
  entityCount,
  onCreateClick,
  onMapClick,
  onTableRowClick,
}: ScreenProps): JSX.Element {
  const [entityTypeFilterState, dispatchEntityTypeFilter] = useReducer(
    reduceEntityTypeSelectorState,
    { selectedIds: ['foo', 'bar'] },
    initializeEntityTypeSelectorState,
  );
  const [statusFilterState, statusFilterDispatch] = useReducer<
    StatusSelectorReducer,
    StatusSelectorInitArgs
  >(reduceMultipleSelectorState, { selectedIds: ['published'] }, initializeStatusSelectorState);
  const [authKeyFilterState, authKeyFilterDispatch] = useReducer<
    AuthKeySelectorReducer,
    AuthKeySelectorInitArgs
  >(reduceMultipleSelectorState, { selectedIds: ['none'] }, initializeAuthKeySelectorState);
  const [burgerOpen, setBurgerOpen] = useState(false);

  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <Navbar>
          <Navbar.Brand>
            <Navbar.Item>{NavItemRender('Dossier')}</Navbar.Item>
            <Navbar.Burger active={burgerOpen} onClick={() => setBurgerOpen(!burgerOpen)} />
          </Navbar.Brand>
          <Navbar.Menu active={burgerOpen}>
            <Navbar.Start>
              <Navbar.Item active>{NavItemRender('Entities')}</Navbar.Item>
            </Navbar.Start>
            <Navbar.End>
              <Navbar.Dropdown
                left
                renderLink={(className) => <a className={className}>Dropdown</a>}
              >
                <Navbar.Item>{NavItemRender('Item 1')}</Navbar.Item>
                <Navbar.Item>{NavItemRender('Item 2')}</Navbar.Item>
              </Navbar.Dropdown>
            </Navbar.End>
          </Navbar.Menu>
        </Navbar>
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow direction="horizontal">
        <FullscreenContainer.Row
          center
          flexDirection="row"
          gap={2}
          paddingVertical={2}
          paddingHorizontal={2}
        >
          <SearchBar
            {...{
              entityTypeFilterState,
              dispatchEntityTypeFilter,
              statusFilterState,
              statusFilterDispatch,
              authKeyFilterState,
              authKeyFilterDispatch,
              onMapClick,
              onCreateClick,
            }}
          />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row paddingVertical={2} paddingHorizontal={2}>
          <EntityTypesList state={entityTypeFilterState} dispatch={dispatchEntityTypeFilter} />
          <StatusTagList state={statusFilterState} dispatch={statusFilterDispatch} />
          <AuthKeyTagList state={authKeyFilterState} dispatch={authKeyFilterDispatch} />
          <EntityTable {...{ entityCount, onTableRowClick }} />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      <FullscreenContainer.Row
        paddingVertical={2}
        paddingHorizontal={2}
        columnGap={2}
        flexDirection="row"
        alignItems="center"
      >
        <IconButton.Group condensed skipBottomMargin>
          <IconButton icon="first" disabled />
          <IconButton icon="previous" disabled />
          <IconButton icon="next" />
          <IconButton icon="last" />
        </IconButton.Group>
        <ButtonDropdown
          up
          sneaky
          items={[{ id: '25' }, { id: '50' }, { id: '100' }]}
          activeItemIds={['25']}
          renderItem={(it) => it.id}
        >
          1&thinsp;–&thinsp;25 of 240
        </ButtonDropdown>
      </FullscreenContainer.Row>
    </FullscreenContainer>
  );
}

function NavItemRender(text: string) {
  const renderer = ({ className }: { className: string }) => {
    return <a className={className}>{text}</a>;
  };
  return renderer;
}

function SearchBar({
  entityTypeFilterState,
  dispatchEntityTypeFilter,
  statusFilterState,
  statusFilterDispatch,
  authKeyFilterState,
  authKeyFilterDispatch,
  onMapClick,
  onCreateClick,
}: {
  entityTypeFilterState: EntityTypeSelectorState;
  dispatchEntityTypeFilter: EntityTypeSelectorDispatch;
  statusFilterState: StatusSelectorState;
  statusFilterDispatch: StatusSelectorDispatch;
  authKeyFilterState: AuthKeySelectorState;
  authKeyFilterDispatch: AuthKeySelectorDispatch;
  onMapClick: (event: MouseEvent) => void;
  onCreateClick: (item: { id: string; name: string }) => void;
}) {
  return (
    <>
      <Input iconLeft="search" placeholder="Search" />
      <EntityTypeSelector state={entityTypeFilterState} dispatch={dispatchEntityTypeFilter}>
        Entity type
      </EntityTypeSelector>
      <StatusSelector state={statusFilterState} dispatch={statusFilterDispatch}>
        Status
      </StatusSelector>
      <AuthKeySelector state={authKeyFilterState} dispatch={authKeyFilterDispatch}>
        Auth keys
      </AuthKeySelector>
      <IconButton icon="map" onClick={onMapClick} />
      <ButtonDropdown
        iconLeft="add"
        left
        items={[
          { id: 'foo', name: 'Foo' },
          { id: 'bar', name: 'Bar' },
        ]}
        renderItem={(it) => it.name}
        onItemClick={onCreateClick}
      >
        Create
      </ButtonDropdown>
    </>
  );
}

function EntityTable({
  entityCount,
  onTableRowClick,
}: {
  entityCount: number;
  onTableRowClick: (event: MouseEvent) => void;
}) {
  return (
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
              <Tag color="published">Published</Tag>
            </Table.Cell>
            <Table.Cell narrow>Today</Table.Cell>
            <Table.Cell narrow>Today</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

function EntityTypesList({
  state,
  dispatch,
}: {
  state: EntityTypeSelectorState;
  dispatch: EntityTypeSelectorDispatch;
}) {
  if (state.selectedIds.length === 0) {
    return null;
  }

  return (
    <Field>
      <Field.Label size="small">Show entity types</Field.Label>
      <Field.Control>
        <TagSelector
          clearLabel="Clear"
          itemTag={(item) => ({ tag: item.name })}
          state={state}
          dispatch={dispatch}
        />
      </Field.Control>
    </Field>
  );
}

export const Normal: Story = {};

export const Empty: Story = { args: { entityCount: 0 } };
