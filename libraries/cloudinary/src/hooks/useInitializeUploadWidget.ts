import { useLayoutEffect, useState } from 'react';
import type {
  CloudinaryUploadWidgetCallback,
  UploadWidget,
} from '../types/CloudinaryUploadWidget.js';
import { useRuntimeDependency } from './useRuntimeDependency.js';

export function useInitializeUploadWidget(
  cloudName: string,
  uploadPreset: string,
  callback: CloudinaryUploadWidgetCallback,
): UploadWidget | null {
  const { status } = useRuntimeDependency('cloudinary-upload-widget');
  const [uploadWidget, setUploadWidget] = useState<UploadWidget | null>(null);

  useLayoutEffect(() => {
    if (status !== 'ready') {
      return;
    }
    const { cloudinary } = window;
    const widget = cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        resourceType: 'image',
      },
      callback,
    );

    setUploadWidget(widget);
    return () => {
      void widget.destroy();
      setUploadWidget(null);
    };
  }, [callback, status]);

  return uploadWidget;
}
