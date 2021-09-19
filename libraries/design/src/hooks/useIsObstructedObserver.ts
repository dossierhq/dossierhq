import type { RefCallback } from 'react';
import { useEffect, useState } from 'react';

let observerInstance: IntersectionObserver | null = null;

function getObserver() {
  if (!observerInstance) {
    observerInstance = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle('is-obstructed', entry.intersectionRatio < 1.0);
        }
      },
      { threshold: [1.0] }
    );
  }
  return observerInstance;
}

export function useIsObstructedObserver(): RefCallback<HTMLElement> {
  const [currentElement, setCurrentElement] = useState<HTMLElement | null>();

  useEffect(() => {
    const observer = getObserver();
    if (currentElement) {
      observer.observe(currentElement);
      return () => {
        return observer.unobserve(currentElement);
      };
    }
  }, [currentElement]);

  const ref = setCurrentElement;
  return ref;
}
