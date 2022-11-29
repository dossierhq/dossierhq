import React from 'react';
import { Row } from '../components/Row/Row.js';
import { Text } from '../components/Text/Text.js';
import type { SpacingValue } from '../utils/LayoutPropsUtils.js';
import { SpacingValues, toSpacingClassName } from '../utils/LayoutPropsUtils.js';

interface Props {
  size: SpacingValue;
}

export function PaddingSwatch({ size }: Props) {
  return (
    <Row style={{ border: 'solid 1px lightgray' }} marginBottom={2}>
      {[...new Array(5)].map((_, index) => (
        <div
          key={index}
          className={toSpacingClassName({ paddingRight: size })}
          style={{ backgroundColor: 'pink' }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              backgroundColor: 'turquoise',
              textAlign: 'center',
            }}
          >
            <Text textStyle="body1">{size}</Text>
          </div>
        </div>
      ))}
    </Row>
  );
}

export function AllPaddingSwatches() {
  return (
    <>
      {SpacingValues.map((size) => (
        <PaddingSwatch key={size} size={size} />
      ))}
    </>
  );
}
