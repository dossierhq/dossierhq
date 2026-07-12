import type { Location, LocationFieldSpecification } from '@dossierhq/core';
import { MapPinIcon } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import type { FieldDisplayProps } from './FieldDisplay.js';
import { Button } from './ui/button.js';
import { Dialog } from './ui/dialog.js';

const LocationDisplayDialogContent = lazy(() =>
  import('./LocationDialogContent.js').then((it) => ({
    default: it.LocationDisplayDialogContent,
  })),
);

type Props = FieldDisplayProps<LocationFieldSpecification, Location>;

export function LocationFieldDisplay({ id, value }: Props) {
  const [showDialog, setShowDialog] = useState(false);

  if (!value) {
    return null;
  }
  return (
    <>
      <Button id={id} className="self-start" variant="outline" onClick={() => setShowDialog(true)}>
        <MapPinIcon />
        {value.lat}, {value.lng}
      </Button>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        {showDialog ? (
          <Suspense>
            <LocationDisplayDialogContent title="Location" value={value} />
          </Suspense>
        ) : null}
      </Dialog>
    </>
  );
}
