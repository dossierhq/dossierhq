import React from 'react';
import type { IconProps } from '../';
import { Icon, IconTypes } from '../';

export function IconSwatch({ icon }: IconProps): JSX.Element {
  return (
    <div className="dd has-background text-body1">
      {icon}
      <br />
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <span
          style={{
            outline: '1px dashed black',
            display: 'inline-block',
          }}
        >
          <Icon icon={icon} />
        </span>
        {['primary', 'danger'].map((bg) => (
          <div key={bg} className={`dd has-background bg-${bg}`}>
            <Icon icon={icon} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AllIconSwatches(): JSX.Element {
  return (
    <>
      {IconTypes.map((icon) => (
        <IconSwatch key={icon} icon={icon} />
      ))}
    </>
  );
}
