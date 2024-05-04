import { useEffect, useState, type RefCallback } from 'react';

let observerInstance: IntersectionObserver | null = null;

function getObserver() {
  if (!observerInstance) {
    observerInstance = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle('is-clipped', entry.intersectionRatio < 1.0);
        }
      },
      { threshold: [1.0] },
    );
  }
  return observerInstance;
}

export function useIsClippedObserver(): RefCallback<HTMLElement> {
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
