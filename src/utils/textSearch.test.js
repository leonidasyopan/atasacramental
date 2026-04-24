import { describe, it, expect } from 'vitest';
import { normalizeForSearch } from './textSearch';

describe('normalizeForSearch', () => {
  it('lowercases ASCII input', () => {
    expect(normalizeForSearch('Silva')).toBe('silva');
  });

  it('strips Portuguese diacritics', () => {
    expect(normalizeForSearch('Leônidas')).toBe('leonidas');
    expect(normalizeForSearch('Conceição')).toBe('conceicao');
    expect(normalizeForSearch('Vinícius')).toBe('vinicius');
    expect(normalizeForSearch('São João')).toBe('sao joao');
  });

  it('allows partial (substring) matching across accents', () => {
    expect(normalizeForSearch('Leônidas').includes(normalizeForSearch('leon'))).toBe(true);
    expect(normalizeForSearch('café').includes(normalizeForSearch('cafe'))).toBe(true);
  });

  it('returns empty string for nullish input', () => {
    expect(normalizeForSearch(null)).toBe('');
    expect(normalizeForSearch(undefined)).toBe('');
    expect(normalizeForSearch('')).toBe('');
  });

  it('coerces non-string input', () => {
    expect(normalizeForSearch(42)).toBe('42');
  });
});
