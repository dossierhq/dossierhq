import type { Location, LocationFieldSpecification } from '@dossierhq/core';
import { MapPinIcon, XIcon } from 'lucide-react';
import { lazy, Suspense, useCallback, useState } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';
import { Button } from './ui/button.js';
import { Dialog } from './ui/dialog.js';
import { ValidationIssuesDisplay } from './ValidationIssuesDisplay.js';

const LocationDialogContent = lazy(() =>
  import('./LocationDialogContent.js').then((it) => ({ default: it.LocationDialogContent })),
);

type Props = FieldEditorProps<LocationFieldSpecification, Location>;

export function LocationFieldEditor({ id, value, validationIssues, dragHandle, onChange }: Props) {
  const [showSelector, setShowSelector] = useState(false);
  const handleShowSelector = useCallback(() => setShowSelector(true), []);
  const handleClear = useCallback(() => onChange(null), [onChange]);

  return (
    <>
      <div className="group flex items-center gap-2">
        {dragHandle}
        <Button id={id} variant="outline" onClick={handleShowSelector}>
          <MapPinIcon />
          {value ? `${value.lat}, ${value.lng}` : 'Select location'}
        </Button>
        {value ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Clear"
            className="size-6 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
            onClick={handleClear}
          >
            <XIcon />
          </Button>
        ) : null}
      </div>
      <ValidationIssuesDisplay validationIssues={validationIssues} />
      <Dialog open={showSelector} onOpenChange={setShowSelector}>
        {showSelector ? (
          <Suspense>
            <LocationDialogContent title="Select location" value={value} onChange={onChange} />
          </Suspense>
        ) : null}
      </Dialog>
    </>
  );
}

export function AddLocationListItemButton({
  onAddItem,
}: {
  fieldSpec: LocationFieldSpecification;
  onAddItem: (value: Location | null) => void;
}) {
  return (
    <Button className="self-start" onClick={() => onAddItem(null)}>
      Add
    </Button>
  );
}
