// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest';
import {
  encodeCalldata,
  decodeCalldata,
  calldataToHex,
  hexToBytes,
  RDTL_MAGIC,
  RDTL_VERSION_1,
  RDTL_V1_LENGTH,
} from './calldata';

// A known 32-byte hash for testing (SHA-256 of the empty string).
const EMPTY_SHA256 = hexToBytes(
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
);

describe('encodeCalldata', () => {
  it('produces a 37-byte payload with correct structure', () => {
    const result = encodeCalldata(EMPTY_SHA256);
    expect(result.length).toBe(RDTL_V1_LENGTH);

    // Magic bytes.
    expect(result[0]).toBe(0x52);
    expect(result[1]).toBe(0x44);
    expect(result[2]).toBe(0x54);
    expect(result[3]).toBe(0x4c);

    // Version.
    expect(result[4]).toBe(RDTL_VERSION_1);

    // Hash.
    expect(result.slice(5, 37)).toEqual(EMPTY_SHA256);
  });

  it('rejects a hash that is not 32 bytes', () => {
    expect(() => encodeCalldata(new Uint8Array(31))).toThrow('Expected 32-byte hash');
    expect(() => encodeCalldata(new Uint8Array(33))).toThrow('Expected 32-byte hash');
    expect(() => encodeCalldata(new Uint8Array(0))).toThrow('Expected 32-byte hash');
  });
});

describe('decodeCalldata', () => {
  it('round-trips with encodeCalldata', () => {
    const encoded = encodeCalldata(EMPTY_SHA256);
    const decoded = decodeCalldata(encoded);

    expect(decoded.version).toBe(RDTL_VERSION_1);
    expect(decoded.hash).toEqual(EMPTY_SHA256);
  });

  it('rejects calldata that is too short', () => {
    expect(() => decodeCalldata(new Uint8Array(4))).toThrow('too short');
  });

  it('rejects calldata with wrong magic bytes', () => {
    const bad = new Uint8Array(37);
    bad.set([0x00, 0x00, 0x00, 0x00], 0);
    expect(() => decodeCalldata(bad)).toThrow('Invalid magic bytes');
  });

  it('rejects calldata with unrecognized version', () => {
    const bad = new Uint8Array(37);
    bad.set(RDTL_MAGIC, 0);
    bad[4] = 0xff;
    expect(() => decodeCalldata(bad)).toThrow('Unrecognized RDTL version');
  });

  it('rejects v1 calldata shorter than 37 bytes', () => {
    const short = new Uint8Array(10);
    short.set(RDTL_MAGIC, 0);
    short[4] = RDTL_VERSION_1;
    expect(() => decodeCalldata(short)).toThrow('too short for v1');
  });
});

describe('calldataToHex', () => {
  it('produces a 0x-prefixed hex string', () => {
    const encoded = encodeCalldata(EMPTY_SHA256);
    const hex = calldataToHex(encoded);
    expect(hex).toMatch(/^0x[0-9a-f]{74}$/);
    expect(hex.startsWith('0x5244544c01')).toBe(true);
  });
});

describe('hexToBytes', () => {
  it('handles 0x prefix', () => {
    const bytes = hexToBytes('0xaabb');
    expect(bytes).toEqual(new Uint8Array([0xaa, 0xbb]));
  });

  it('handles no prefix', () => {
    const bytes = hexToBytes('aabb');
    expect(bytes).toEqual(new Uint8Array([0xaa, 0xbb]));
  });

  it('rejects odd-length hex', () => {
    expect(() => hexToBytes('0xaab')).toThrow('even length');
  });
});
