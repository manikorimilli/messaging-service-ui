import { describe, expect, it } from 'vitest';
import { pageList } from '../components/TablePagination.jsx';

describe('pageList', () => {
  it('shows every page when there are only a few', () => {
    expect(pageList(1, 1)).toEqual([1]);
    expect(pageList(2, 3)).toEqual([1, 2, 3]);
  });
  it('keeps first, last and the neighbours of the current page, with gaps', () => {
    expect(pageList(5, 9)).toEqual([1, 'gap-4', 4, 5, 6, 'gap-9', 9]);
    expect(pageList(1, 9)).toEqual([1, 2, 'gap-9', 9]);
    expect(pageList(9, 9)).toEqual([1, 'gap-8', 8, 9]);
  });
});
