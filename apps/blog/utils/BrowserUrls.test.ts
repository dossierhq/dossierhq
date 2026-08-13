import { describe, expect, test } from 'vitest';
import { canonicalUrl } from './BrowserUrls.js';

describe('canonicalUrl', () => {
  test('root', () => {
    expect(canonicalUrl('/')).toBe('https://www.dossierhq.dev');
  });

  test('path', () => {
    expect(canonicalUrl('/docs')).toBe('https://www.dossierhq.dev/docs');
  });

  test('throws on url not starting with /', () => {
    expect(() => canonicalUrl('docs')).toThrow('URL must start with /');
  });
});
