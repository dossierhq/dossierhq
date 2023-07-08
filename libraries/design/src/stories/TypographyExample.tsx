import React, { useCallback, useState } from 'react';
import { Text } from '../components/Text/Text.js';
import type { TextStyle } from '../utils/TextStylePropsUtils.js';

interface Props {
  textStyle: TextStyle;
  loremIpsum?: boolean;
}

export default function TypographyExample({ textStyle, loremIpsum }: Props): JSX.Element {
  const [fontStyles, setFontStyles] = useState<Record<string, string>>({});

  const onRefChanged = useCallback(
    (ref: HTMLSpanElement) => {
      if (ref) {
        const { fontFamily, fontWeight, fontSize, lineHeight } = getComputedStyle(ref);
        setFontStyles({
          Font: fontFamily,
          Weight: fontWeight,
          Size: fontSize,
          'Line-height': lineHeight,
        });
      }
    },
    [setFontStyles],
  );

  return (
    <div
      style={{
        borderLeftWidth: '0.25rem',
        borderLeftColor: 'black',
        borderLeftStyle: 'solid',
        paddingLeft: '1rem',
        marginBottom: '1rem',
      }}
    >
      <div style={{ border: '1px dashed black', marginBottom: '0.5rem' }}>
        <Text textStyle={textStyle}>
          <span ref={onRefChanged} />
          {textStyle}
          {loremIpsum
            ? '. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer volutpat ante sem, quis aliquet urna consectetur ut. In elit erat, ultrices id tellus nec, efficitur tempor ipsum. Fusce sit amet nisl a ex feugiat auctor in id nunc.'
            : ''}
        </Text>
      </div>
      <table>
        <tbody>
          <tr>
            {Object.keys(fontStyles).map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
          <tr>
            {Object.entries(fontStyles).map(([key, value]) => (
              <td key={key}>{value}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
