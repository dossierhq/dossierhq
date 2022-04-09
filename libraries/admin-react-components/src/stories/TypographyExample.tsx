import React, { useCallback, useState } from 'react';

interface Props {
  className: string;
  loremIpsum?: boolean;
}

export default function TypographyExample({ className, loremIpsum }: Props): JSX.Element {
  const [fontStyles, setFontStyles] = useState<Record<string, string>>({});

  const onRefChanged = useCallback(
    (ref: HTMLParagraphElement) => {
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
    [setFontStyles]
  );

  return (
    <div
      style={{
        borderLeftWidth: '0.25rem',
        borderLeftColor: 'black',
        borderLeftStyle: 'solid',
        paddingLeft: '1rem',
      }}
    >
      <p
        className={className}
        ref={onRefChanged}
        style={{ border: '1px dashed black', marginBottom: '0.5rem' }}
      >
        {className}
        {loremIpsum
          ? '. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer volutpat ante sem, quis aliquet urna consectetur ut. In elit erat, ultrices id tellus nec, efficitur tempor ipsum. Fusce sit amet nisl a ex feugiat auctor in id nunc.'
          : ''}
      </p>
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
