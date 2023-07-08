export function findAscendantElement(
  node: Node,
  predicate: (element: Element) => boolean,
): Element | null {
  const startElement = isElementNode(node) ? node : node.parentElement;
  for (let element: Element | null = startElement; element; element = element.parentElement) {
    if (predicate(element)) {
      return element;
    }
  }
  return null;
}

function isElementNode(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

export function findAscendantHTMLElement(
  node: Node,
  predicate: (element: HTMLElement) => boolean,
): HTMLElement | null {
  const result = findAscendantElement(
    node,
    (element) => element instanceof HTMLElement && predicate(element),
  );
  return result instanceof HTMLElement ? result : null;
}
