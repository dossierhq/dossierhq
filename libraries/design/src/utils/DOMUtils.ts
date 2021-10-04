export function findAscendantElement(
  element: HTMLElement,
  predicate: (element: HTMLElement) => boolean
): HTMLElement | null {
  for (let el: HTMLElement | null = element; el; el = el.parentElement) {
    if (predicate(el)) {
      return el;
    }
  }
  return null;
}
