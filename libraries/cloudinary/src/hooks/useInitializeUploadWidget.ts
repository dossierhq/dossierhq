import { useCallback, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
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
  const widgetRef = useRef<UploadWidget | null>(null);
  const listenersRef = useRef<Set<() => void>>(new Set());

  const notify = () => {
    for (const listener of listenersRef.current) listener();
  };

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

    widgetRef.current = widget;
    notify();
    return () => {
      void widget.destroy();
      widgetRef.current = null;
      notify();
    };
    //TODO fix deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, status]);

  const subscribe = useCallback((onStoreChange: () => void) => {
    listenersRef.current.add(onStoreChange);
    return () => {
      listenersRef.current.delete(onStoreChange);
    };
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => widgetRef.current,
    () => null,
  );
}
