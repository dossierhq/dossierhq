import type { ChangeEventHandler } from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';
import { IconAsset } from '../Icon/Icon.js';

export interface FileProps {
  className?: string;
  accept?: string;
  boxed?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export function File({ className, accept, boxed, onChange }: FileProps): JSX.Element {
  return (
    <div className={toClassName('file', boxed && 'is-boxed', className)}>
      <label className="file-label">
        <input className="file-input" type="file" accept={accept} onChange={onChange} />
        <span className="file-cta">
          <span className="file-icon">
            <IconAsset icon="upload" />
          </span>
          <span className="file-label">Choose a file…</span>
        </span>
      </label>
    </div>
  );
}
