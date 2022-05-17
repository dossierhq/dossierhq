import React from 'react';
import type { ButtonProps } from '../Button/Button';
import { Button } from '../Button/Button';
import type { DropDownItem, DropDownProps } from '../DropDown/DropDown';
import { DropDown } from '../DropDown/DropDown';
import { Row, RowItem } from '../Row/Row';

export interface ButtonWithDropDownProps<TDropDownItem extends DropDownItem = DropDownItem>
  extends ButtonProps {
  id: string;
  dropDownTitle: string;
  items: TDropDownItem[];
  onItemClick: (item: TDropDownItem) => void;
}

export function ButtonWithDropDown<TDropDownItem extends DropDownItem>(
  props: ButtonWithDropDownProps<TDropDownItem>
): JSX.Element {
  const { id, className, children, dropDownTitle, items, onItemClick, ...buttonProps } = props;
  return (
    <Row className={className}>
      <Button id={id} {...buttonProps}>
        {children}
      </Button>
      {items.length > 0 ? (
        <RowItem
          as={DropDown as React.JSXElementConstructor<DropDownProps<TDropDownItem>>}
          id={`${id}-dropdown`}
          items={items}
          text={dropDownTitle}
          showAsIcon
          onItemClick={onItemClick}
        />
      ) : null}
    </Row>
  );
}
