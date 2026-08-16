import { Cloudinary } from '@cloudinary/url-gen';
import { name } from '@cloudinary/url-gen/actions/namedTransformation';
import {
  groupValidationIssuesByTopLevelPath,
  type ComponentFieldSpecification,
  type PublishValidationIssue,
  type SaveValidationIssue,
} from '@dossierhq/core';
import type { FieldEditorProps } from '@dossierhq/react-components2';
import { ExternalLinkIcon, XIcon } from 'lucide-react';
import { useCallback, useMemo, type JSX, type ReactNode } from 'react';
import { useInitializeUploadWidget } from '../hooks/useInitializeUploadWidget.js';
import type { AdminCloudinaryImage } from '../types/CloudinaryImageComponent.js';
import type { CloudinaryUploadResult } from '../types/CloudinaryUploadWidget.js';
import { ValidationIssuesDisplay } from './ValidationIssuesDisplay.js';

type Props = FieldEditorProps<ComponentFieldSpecification, AdminCloudinaryImage> & {
  cloudName: string;
  uploadPreset: string;
  value: AdminCloudinaryImage;
};

const NO_VALIDATION_ISSUES: (SaveValidationIssue | PublishValidationIssue)[] = [];

export function CloudinaryImageFieldEditor({
  id,
  cloudName,
  uploadPreset,
  value,
  validationIssues,
  dragHandle,
  onChange,
}: Props): JSX.Element {
  const handleDeleteClick = useCallback(() => onChange(null), [onChange]);
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label="Remove"
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground absolute top-1 right-1 inline-flex size-6 items-center justify-center rounded-md opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
        onClick={handleDeleteClick}
      >
        <XIcon className="size-4" />
      </button>
      <CloudinaryImageFieldEditorWithoutClear
        id={id}
        cloudName={cloudName}
        uploadPreset={uploadPreset}
        value={value}
        validationIssues={validationIssues}
        dragHandle={dragHandle}
        onChange={onChange}
      />
    </div>
  );
}

export function CloudinaryImageFieldEditorWithoutClear({
  id,
  cloudName,
  uploadPreset,
  value,
  validationIssues,
  dragHandle,
  onChange,
}: {
  id?: string;
  cloudName: string;
  uploadPreset: string;
  value: AdminCloudinaryImage;
  validationIssues: (SaveValidationIssue | PublishValidationIssue)[];
  dragHandle?: ReactNode;
  onChange: (value: AdminCloudinaryImage) => void;
}): JSX.Element {
  const { publicId } = value;

  const { publicIdValidationIssues, altValidationIssues } = useMemo(() => {
    const { root: _, children } = groupValidationIssuesByTopLevelPath(validationIssues);
    const publicIdValidationIssues = children.get('publicId') ?? NO_VALIDATION_ISSUES;
    const altValidationIssues = children.get('alt') ?? NO_VALIDATION_ISSUES;
    return { publicIdValidationIssues, altValidationIssues };
  }, [validationIssues]);

  if (!publicId) {
    return (
      <>
        <div className="flex items-center gap-2">
          {dragHandle}
          <UploadButton {...{ id, cloudName, uploadPreset, onChange }} />
        </div>
        <ValidationIssuesDisplay validationIssues={publicIdValidationIssues} />
      </>
    );
  }

  const cld = new Cloudinary({ cloud: { cloudName } });

  const thumbnailImageUrl = cld
    .image(publicId)
    .namedTransformation(name('media_lib_thumb'))
    .toURL();
  const fullImageUrl = cld.image(publicId).toURL();

  return (
    <div id={id} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {dragHandle}
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
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor={`${id ?? publicId}-size`}>
          Size
        </label>
        <input
          id={`${id ?? publicId}-size`}
          className="border-input bg-muted text-muted-foreground h-9 w-full rounded-md border px-3 py-1 text-base shadow-xs md:text-sm"
          readOnly
          value={`${value.width} × ${value.height} px`}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor={`${id ?? publicId}-alt`}>
          Alt
        </label>
        <input
          id={`${id ?? publicId}-alt`}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs focus-visible:ring-[3px] focus-visible:outline-none md:text-sm"
          value={value.alt ?? ''}
          onChange={(event) => {
            onChange({ ...value, alt: event.target.value });
          }}
        />
        <ValidationIssuesDisplay validationIssues={altValidationIssues} />
      </div>
    </div>
  );
}

function UploadButton({
  id,
  cloudName,
  uploadPreset,
  onChange,
}: {
  id?: string;
  cloudName: string;
  uploadPreset: string;
  onChange: (value: AdminCloudinaryImage) => void;
}) {
  const uploadWidgetCallback = useCallback(
    (error: Error | undefined, result: CloudinaryUploadResult | undefined) =>
      handleUploadWidgetCallback(error, result, onChange),
    [onChange],
  );
  const uploadWidget = useInitializeUploadWidget(cloudName, uploadPreset, uploadWidgetCallback);

  return (
    <button
      id={id}
      type="button"
      className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 shrink-0 items-center justify-center gap-2 self-start rounded-md px-4 py-2 text-sm font-medium shadow-xs disabled:pointer-events-none disabled:opacity-50"
      disabled={!uploadWidget}
      onClick={uploadWidget ? () => uploadWidget.open() : undefined}
    >
      Upload image
    </button>
  );
}

function handleUploadWidgetCallback(
  error: Error | undefined,
  result: CloudinaryUploadResult | undefined,
  onChange: (value: AdminCloudinaryImage) => void,
) {
  if (result && result.event === 'success') {
    const asset = result.info;
    onChange({
      type: 'CloudinaryImage',
      publicId: asset.public_id,
      width: asset.width,
      height: asset.height,
      alt: null,
    });
  }
}
