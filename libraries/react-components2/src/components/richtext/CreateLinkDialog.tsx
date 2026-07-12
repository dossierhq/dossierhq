import { useCallback, useState, type FormEvent } from 'react';
import { Button } from '../ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.js';
import { Input } from '../ui/input.js';
import { Label } from '../ui/label.js';

interface Props {
  showEntityLink: boolean;
  onCreateLink: (url: string) => void;
  onCreateEntityLink: () => void;
  onClose: () => void;
}

export function CreateLinkDialog({
  showEntityLink,
  onCreateLink,
  onCreateEntityLink,
  onClose,
}: Props) {
  const [url, setUrl] = useState('https://');
  const sanitizedUrl = sanitizeUrl(url);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (sanitizedUrl) {
        onCreateLink(sanitizedUrl);
      }
    },
    [onCreateLink, sanitizedUrl],
  );

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create link</DialogTitle>
            <DialogDescription>
              {showEntityLink
                ? 'Link to a URL, or link to an entity.'
                : 'Enter the URL to link to.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="create-link-url">URL</Label>
            <Input
              id="create-link-url"
              type="url"
              value={url}
              autoFocus
              onChange={(event) => setUrl(event.target.value)}
            />
          </div>
          <DialogFooter>
            {showEntityLink ? (
              <Button type="button" variant="outline" onClick={onCreateEntityLink}>
                Entity link
              </Button>
            ) : null}
            <Button type="submit" disabled={!sanitizedUrl}>
              Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function sanitizeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return urlObj.toString();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // ignore
  }
  return null;
}
