import { describe, expect, it } from 'vitest';
import { numberWithThousandsSeparator } from './NumberDisplayUtils.js';

describe('numberWithThousandsSeparator', () => {
  it('0', () => {
    expect(numberWithThousandsSeparator(0)).toBe(0);
  });

  it('123', () => {
    expect(numberWithThousandsSeparator(123)).toBe(123);
  });

  it('1234', () => {
    expect(numberWithThousandsSeparator(1234)).toBe('1 234');
  });

  it('123456', () => {
    expect(numberWithThousandsSeparator(123456)).toBe('123 456');
  });

  it('1234567', () => {
    expect(numberWithThousandsSeparator(1234567)).toBe('1 234 567');
  });
});
