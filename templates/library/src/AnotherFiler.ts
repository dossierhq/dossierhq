import type { TemplateInterface } from './TemplateFile.js';
import { TEMPLATE_VALUE } from './TemplateFile.js';

export function hello() {
  const a: TemplateInterface = TEMPLATE_VALUE;
  return a;
}
