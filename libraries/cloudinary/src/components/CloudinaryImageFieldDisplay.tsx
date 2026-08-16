import { Cloudinary } from '@cloudinary/url-gen';
import { name } from '@cloudinary/url-gen/actions/namedTransformation';
import { ExternalLinkIcon } from 'lucide-react';
import type { JSX } from 'react';
import type { PublishedCloudinaryImage } from '../types/CloudinaryImageComponent.js';

interface Props {
  cloudName: string;
  value: PublishedCloudinaryImage;
}

export function CloudinaryImageFieldDisplay({ cloudName, value }: Props): JSX.Element {
  const { publicId } = value;

  const cld = new Cloudinary({ cloud: { cloudName } });
  const thumbnailImageUrl = cld
    .image(publicId)
    .namedTransformation(name('media_lib_thumb'))
    .toURL();
  const fullImageUrl = cld.image(publicId).toURL();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <img className="max-w-full rounded-md" src={thumbnailImageUrl} alt={value.alt ?? ''} />
        <button
          type="button"
          aria-label="Open image in new window"
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground inline-flex size-8 items-center justify-center rounded-md"
          onClick={() => window.open(fullImageUrl, '_blank')}
        >
          <ExternalLinkIcon className="size-4" />
        </button>
      </div>
      <p className="text-muted-foreground text-sm">{`${value.width} × ${value.height} px`}</p>
    </div>
  );
}
