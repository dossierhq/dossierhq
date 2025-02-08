import type { JSX } from 'react';
import { Row } from '../components/Row/Row.js';
import { Text } from '../components/Text/Text.js';
import { SpacingValues, toSpacingClassName, type SpacingValue } from '../utils/LayoutPropsUtils.js';

interface Props {
  size: SpacingValue;
}

export function PaddingSwatch({ size }: Props): JSX.Element {
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

export function AllPaddingSwatches(): JSX.Element {
  return (
    <>
      {SpacingValues.map((size) => (
        <PaddingSwatch key={size} size={size} />
      ))}
    </>
  );
}
