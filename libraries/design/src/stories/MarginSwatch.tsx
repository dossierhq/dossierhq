import React from 'react';
import { Row } from '../components/Row/Row.js';
import { Text } from '../components/Text/Text.js';
import type { SpacingValue } from '../utils/LayoutPropsUtils.js';
import { SpacingValues, toSpacingClassName } from '../utils/LayoutPropsUtils.js';

interface MarginSwatchProps {
  size: SpacingValue;
}

export function MarginSwatch({ size }: MarginSwatchProps) {
  return (
    <Row style={{ border: 'solid 1px lightgray' }} marginBottom={2}>
      {[...new Array(5)].map((_, index) => (
        <Text
          key={index}
          className={toSpacingClassName({ marginRight: size })}
          textStyle="body1"
          style={{
            width: '30px',
            height: '30px',
            backgroundColor: 'turquoise',
            textAlign: 'center',
          }}
        >
          {size}
        </Text>
      ))}
    </Row>
  );
}

export function AllMarginSwatches() {
  return (
    <>
      {SpacingValues.map((size) => (
        <MarginSwatch key={size} size={size} />
      ))}
    </>
  );
}
