import { urls } from './PageUtils';

describe('urls', () => {
  test('editPage', () => {
    expect(urls.editPage(['id1', 'id2'])).toBe('/entities/edit?ids=id1,id2');
  });
});
