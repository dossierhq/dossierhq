export function findAscendantElement(
  node: Node,
  predicate: (element: Element) => boolean
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
