import { describe, expect, test } from 'vitest';
import { TEMPLATE_VALUE } from './TemplateFile.js';

describe('hello', () => {
  test('world', () => {
    expect(TEMPLATE_VALUE.value).toBe('hello world');
  });

  test('inline snapshot', () => {
    expect({ what: 123 }).toMatchInlineSnapshot(`
      {
        "what": 123,
      }
    `);
  });

  test('snapshot', () => {
    expect({ what: 123 }).toMatchSnapshot();
  });
});
