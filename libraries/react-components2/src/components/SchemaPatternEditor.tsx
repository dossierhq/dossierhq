import type { SchemaPatternDraft } from '../reducers/SchemaEditorReducer.js';
import { Input } from './ui/input.js';
import { Label } from './ui/label.js';

interface Props {
  patternDraft: SchemaPatternDraft;
  onEditPattern: () => void;
}

export function SchemaPatternEditor({ patternDraft, onEditPattern }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <Label>Pattern</Label>
      <Input
        readOnly
        className="font-mono"
        value={patternDraft.pattern}
        placeholder="Click to edit pattern…"
        onClick={onEditPattern}
      />
    </div>
  );
}
