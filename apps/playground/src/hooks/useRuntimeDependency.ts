import { useEffect, useState } from 'react';

const EXTERNAL_DEPENDENCIES = {
  'cloudinary-upload-widget': 'https://upload-widget.cloudinary.com/global/all.js',
};

type Status = 'loading' | 'error' | 'ready';

const dependencyStatus: Record<string, Promise<Status> | undefined> = {};

export function useRuntimeDependency(dependencyName: keyof typeof EXTERNAL_DEPENDENCIES): {
  status: Status;
} {
  const scriptUrl = EXTERNAL_DEPENDENCIES[dependencyName];
  // check if the promise is already set
  let initialStatus: Status = 'loading';
  dependencyStatus[scriptUrl]?.then((status) => {
    initialStatus = status;
  });
  const [status, setStatus] = useState<Status>(initialStatus);

  useEffect(() => {
    const statusPromise = dependencyStatus[scriptUrl];
    if (statusPromise) {
      statusPromise.then(setStatus);
      return;
    }

    dependencyStatus[scriptUrl] = new Promise((resolve) => {
      const updateStatus = (newStatus: Status) => {
        // Notify other instances of the hook
        resolve(newStatus);
        // Notify this hook
        setStatus(newStatus);
      };

      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => {
        updateStatus('ready');
      };
      script.onerror = () => {
        updateStatus('error');
      };
      document.body.appendChild(script);
    });
  }, [scriptUrl]);

  return { status };
}
