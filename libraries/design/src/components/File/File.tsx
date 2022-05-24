import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ChangeEventHandler } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import { icons } from '../Icon/Icon.js';

export interface FileProps {
  accept?: string;
  boxed?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export function File({ accept, boxed, onChange }: FileProps): JSX.Element {
  return (
    <div className={toClassName('file', boxed && 'is-boxed')}>
      <label className="file-label">
        <input className="file-input" type="file" accept={accept} onChange={onChange} />
        <span className="file-cta">
          <span className="file-icon">
            <FontAwesomeIcon icon={icons['upload']} />
          </span>
          <span className="file-label">Choose a file…</span>
        </span>
      </label>
    </div>
  );
}
