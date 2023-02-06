// Subset of https://cloudinary.com/documentation/upload_widget_reference

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget(
        options: UploadWidgetOptions,
        callback: CloudinaryUploadWidgetCallback
      ): UploadWidget;
    };
  }
}

type UploadSource =
  | 'local'
  | 'url'
  | 'camera'
  | 'dropbox'
  | 'image_search'
  | 'facebook'
  | 'instagram'
  | 'shutterstock'
  | 'gettyimages'
  | 'istock'
  | 'unsplash'
  | 'google_drive';

type UploadResourceType = 'auto' | 'image' | 'video' | 'raw';

interface UploadWidgetOptions {
  cloudName: string;
  uploadPreset: string;
  sources?: UploadSource[];
  multiple?: boolean;
  resourceType?: UploadResourceType;
}

// Contains many more events
export type CloudinaryUploadResult =
  | { event: 'success'; info: CloudinaryAsset }
  | { event: 'close' };

export interface CloudinaryAsset {
  access_mode: 'public';
  asset_id: string;
  batchId: string;
  bytes: number;
  created_at: string;
  etag: string;
  folder: string;
  format: string;
  height: number;
  id: string;
  original_filename: string;
  path: string;
  placeholder: boolean;
  public_id: string;
  resource_type: 'image' | 'video' | 'raw';
  secure_url: string;
  signature: string;
  tags: string[];
  thumbnail_url: string;
  type: 'authenticated' | 'upload';
  url: string;
  version: number;
  version_id: string;
  width: number;
}

export type CloudinaryUploadWidgetCallback = (
  error: Error | undefined,
  result: CloudinaryUploadResult | undefined
) => void;

export interface UploadWidget {
  open(): void;
  destroy(): Promise<void>;
}
