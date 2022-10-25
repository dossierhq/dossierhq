import { describe, expect, test } from 'vitest';
import { urls } from './PageUtils.js';

describe('urls', () => {
  test('editPage', () => {
    expect(urls.editPage(['id1', 'id2'])).toBe('/entities/edit?id=id1&id=id2');
  });
});
