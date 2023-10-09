import { describe, expect, test } from 'vitest';
import { BrowserUrls } from './BrowserUrls.js';

describe('BrowserUrls', () => {
  test('editPage', () => {
    expect(BrowserUrls.editPage(['id1', 'id2'])).toBe('/dossier/content/edit?id=id1&id=id2');
  });
});
