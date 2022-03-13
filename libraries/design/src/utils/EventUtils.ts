export function isEventTargetNode(eventTarget: EventTarget | null): eventTarget is Node {
  return eventTarget instanceof Node;
}
