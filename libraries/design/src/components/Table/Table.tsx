import type { FunctionComponent, MouseEventHandler } from 'react';
import React from 'react';
import { Table as BulmaTable } from 'react-bulma-components';
import { Icon } from '..';
import { toClassName } from '../../utils/ClassNameUtils';

export interface TableProps {
  children: React.ReactNode;
}

interface TableHeadProps {
  children: React.ReactNode;
}

interface TableBodyProps {
  children: React.ReactNode;
}

interface TableRowProps {
  children: React.ReactNode;
  clickable?: boolean;
  sticky?: boolean;
  onClick?: MouseEventHandler<HTMLTableRowElement>;
}

interface TableHeaderProps {
  clickable?: boolean;
  narrow?: boolean;
  order?: 'asc' | 'desc' | '';
  onClick?: MouseEventHandler<HTMLTableCellElement>;
  children: React.ReactNode;
}

interface TableCellProps {
  narrow?: boolean;
  children: React.ReactNode;
}

interface TableComponent extends FunctionComponent<TableProps> {
  Head: FunctionComponent<TableHeadProps>;
  Body: FunctionComponent<TableBodyProps>;
  Row: FunctionComponent<TableRowProps>;
  Header: FunctionComponent<TableHeaderProps>;
  Cell: FunctionComponent<TableCellProps>;
}

export const Table: TableComponent = ({ children }: TableProps) => {
  return (
    <BulmaTable size="fullwidth" hoverable>
      {children}
    </BulmaTable>
  );
};
Table.displayName = 'Table';

Table.Head = ({ children }: TableHeadProps) => <thead>{children}</thead>;
Table.Head.displayName = 'Table.Head';

Table.Body = ({ children }: TableBodyProps) => <tbody>{children}</tbody>;
Table.Body.displayName = 'Table.Body';

Table.Row = ({ clickable, sticky, onClick, children }: TableRowProps) => {
  const className = toClassName(
    clickable && 'is-clickable',
    sticky && 'is-sticky-row has-background-white'
  );
  return (
    <tr className={className} onClick={onClick}>
      {children}
    </tr>
  );
};
Table.Row.displayName = 'Table.Row';

Table.Header = ({ clickable, narrow, order, onClick, children }: TableHeaderProps) => {
  const className = toClassName(
    (clickable || order !== undefined) && 'is-clickable',
    narrow && 'is-narrow',
    order !== undefined && 'is-order-header'
  );
  const iconName = order === 'asc' ? 'orderAsc' : order === 'desc' ? 'orderDesc' : null;
  return (
    <th className={className} onClick={onClick}>
      {children}
      {order !== undefined ? <Icon icon={iconName} text /> : null}
    </th>
  );
};
Table.Header.displayName = 'Table.Header';

Table.Cell = ({ narrow, children }: TableCellProps) => {
  const className = narrow ? 'is-narrow' : undefined;
  return <td className={className}>{children}</td>;
};
Table.Cell.displayName = 'Table.Cell';
