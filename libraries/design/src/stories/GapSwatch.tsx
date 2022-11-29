import React from 'react';
import { Row } from '../components/Row/Row.js';
import { Text } from '../components/Text/Text.js';
import type { SpacingValue } from '../utils/LayoutPropsUtils.js';
import { SpacingValues } from '../utils/LayoutPropsUtils.js';

interface GapSwatchProps {
  size: SpacingValue;
}

export function GapSwatch({ size }: GapSwatchProps): JSX.Element {
  return (
    <Row gap={size} style={{ border: 'solid 1px lightgray' }} marginBottom={2}>
      {[...new Array(5)].map((_, index) => (
        <Text
          key={index}
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

export function AllGapSwatches() {
  return (
    <>
      {SpacingValues.map((size) => (
        <GapSwatch key={size} size={size} />
      ))}
    </>
  );
}
