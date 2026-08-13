import { describe, expect, test } from 'vitest';
import type { FieldDisplayProps } from '../components/FieldDisplay.js';
import type { DossierContextAdapter } from '../contexts/DossierContext.js';
import type { PublishedDossierContextAdapter } from '../contexts/PublishedDossierContext.js';
import { resolveDisplayOverrides } from './useDisplayAdapter.js';

const fieldProps = { fieldSpec: { name: 'field' }, value: null } as unknown as FieldDisplayProps;

const fullAdapter: DossierContextAdapter = {
  renderFieldEditor: () => 'full-editor',
  renderFieldDisplay: () => 'full-display',
  renderRichTextComponentDisplay: () => 'full-rich-text',
};

const publishedAdapter: PublishedDossierContextAdapter = {
  renderPublishedFieldDisplay: () => 'published-display',
  renderPublishedRichTextComponentDisplay: () => 'published-rich-text',
};

describe('resolveDisplayOverrides', () => {
  test('published mode uses the published adapter, not the full one', () => {
    const overrides = resolveDisplayOverrides('published', fullAdapter, publishedAdapter);
    expect(overrides.renderFieldDisplay(fieldProps)).toBe('published-display');
    expect(overrides.renderRichTextComponentDisplay({ value: { type: 'Foo' } })).toBe(
      'published-rich-text',
    );
  });

  test('full mode uses the full adapter', () => {
    const overrides = resolveDisplayOverrides('full', fullAdapter, publishedAdapter);
    expect(overrides.renderFieldDisplay(fieldProps)).toBe('full-display');
    expect(overrides.renderRichTextComponentDisplay({ value: { type: 'Foo' } })).toBe(
      'full-rich-text',
    );
  });

  // A published-only app has no DossierProvider, so DossierContext holds its placeholder
  // value and `fullAdapter` is undefined. The published adapter must still be used.
  test('published mode works without a full adapter', () => {
    const overrides = resolveDisplayOverrides('published', undefined, publishedAdapter);
    expect(overrides.renderFieldDisplay(fieldProps)).toBe('published-display');
  });

  test('returns null when no adapter is registered', () => {
    const overrides = resolveDisplayOverrides('published', undefined, undefined);
    expect(overrides.renderFieldDisplay(fieldProps)).toBeNull();
    expect(overrides.renderRichTextComponentDisplay({ value: { type: 'Foo' } })).toBeNull();
  });

  test('falls back to the built-in display when the adapter declines', () => {
    const declining: PublishedDossierContextAdapter = { renderPublishedFieldDisplay: () => null };
    const overrides = resolveDisplayOverrides('published', fullAdapter, declining);
    expect(overrides.renderFieldDisplay(fieldProps)).toBeNull();
    // the optional rich text hook is absent entirely
    expect(overrides.renderRichTextComponentDisplay({ value: { type: 'Foo' } })).toBeNull();
  });
});
