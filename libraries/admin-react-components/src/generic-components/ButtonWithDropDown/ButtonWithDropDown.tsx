import React from 'react';
import { Button, DropDown, Row, RowItem } from '../..';
import type { ButtonProps, DropDownItem, DropDownProps } from '../..';

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
