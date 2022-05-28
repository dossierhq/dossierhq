import { describe, expect, test } from 'vitest';
import { urls } from './PageUtils';

describe('urls', () => {
  test('editPage', () => {
    expect(urls.editPage(['id1', 'id2'])).toBe('/entities/edit?id=id1&id=id2');
  });
});
