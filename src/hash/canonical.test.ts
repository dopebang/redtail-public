// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest';
import { canonicalizeMetadata, canonicalizeObject, computeRecordHash, sha256 } from './canonical';

describe('canonicalizeObject', () => {
  it('sorts keys lexicographically', () => {
    const result = canonicalizeObject({ z: 1, a: 2, m: 3 });
    expect(Object.keys(result)).toEqual(['a', 'm', 'z']);
  });

  it('omits null values', () => {
    const result = canonicalizeObject({ a: 1, b: null, c: 3 });
    expect(result).toEqual({ a: 1, c: 3 });
    expect('b' in result).toBe(false);
  });

  it('omits undefined values', () => {
    const result = canonicalizeObject({ a: 1, b: undefined });
    expect(result).toEqual({ a: 1 });
  });

  it('sorts nested object keys', () => {
    const result = canonicalizeObject({
      outer: { z: 1, a: 2 },
    });
    const inner = result['outer'] as Record<string, unknown>;
    expect(Object.keys(inner)).toEqual(['a', 'z']);
  });

  it('preserves array order but processes elements', () => {
    const result = canonicalizeObject({
      items: [{ z: 1, a: 2 }, { b: 3, a: 4 }],
    });
    const items = result['items'] as Record<string, unknown>[];
    expect(Object.keys(items[0])).toEqual(['a', 'z']);
    expect(Object.keys(items[1])).toEqual(['a', 'b']);
  });
});

describe('canonicalizeMetadata', () => {
  it('produces compact sorted JSON', () => {
    const result = canonicalizeMetadata({
      title: 'Untitled #7',
      category: 'painting',
      year: 2024,
      medium: null,
      dimensions: { height: 120, width: 80, unit: 'cm' },
    });

    expect(result).toBe(
      '{"category":"painting","dimensions":{"height":120,"unit":"cm","width":80},"title":"Untitled #7","year":2024}'
    );
  });

  it('produces empty object for empty input', () => {
    expect(canonicalizeMetadata({})).toBe('{}');
  });
});

describe('computeRecordHash', () => {
  it('produces a 32-byte hash', async () => {
    const metadata = { title: 'Test', category: 'test' };
    const mediaHash = new Uint8Array(32).fill(0xaa);
    const result = await computeRecordHash(metadata, [mediaHash]);
    expect(result.length).toBe(32);
  });

  it('is deterministic', async () => {
    const metadata = { title: 'Test', category: 'test' };
    const mediaHash = new Uint8Array(32).fill(0xbb);
    const a = await computeRecordHash(metadata, [mediaHash]);
    const b = await computeRecordHash(metadata, [mediaHash]);
    expect(a).toEqual(b);
  });

  it('changes when metadata changes', async () => {
    const mediaHash = new Uint8Array(32).fill(0xcc);
    const a = await computeRecordHash({ title: 'A' }, [mediaHash]);
    const b = await computeRecordHash({ title: 'B' }, [mediaHash]);
    expect(a).not.toEqual(b);
  });

  it('changes when media changes', async () => {
    const metadata = { title: 'Same' };
    const a = await computeRecordHash(metadata, [new Uint8Array(32).fill(0x01)]);
    const b = await computeRecordHash(metadata, [new Uint8Array(32).fill(0x02)]);
    expect(a).not.toEqual(b);
  });

  it('rejects media hashes that are not 32 bytes', async () => {
    await expect(
      computeRecordHash({ title: 'Test' }, [new Uint8Array(16)])
    ).rejects.toThrow('expected 32');
  });

  it('works with no media', async () => {
    const result = await computeRecordHash({ title: 'No media' }, []);
    expect(result.length).toBe(32);
  });
});

describe('sha256', () => {
  it('computes correct hash for empty input', async () => {
    const result = await sha256(new Uint8Array(0));
    // SHA-256 of empty string = e3b0c442...
    const hex = Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('');
    expect(hex).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
});
