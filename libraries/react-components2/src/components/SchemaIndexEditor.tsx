import type { SchemaIndexDraft } from '../reducers/SchemaEditorReducer.js';
import { Input } from './ui/input.js';
import { Label } from './ui/label.js';

interface Props {
  indexDraft: SchemaIndexDraft;
}

export function SchemaIndexEditor({ indexDraft }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <Label>Index type</Label>
      <Input readOnly value={indexDraft.type} />
    </div>
  );
}
