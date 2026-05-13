// SPDX-License-Identifier: Apache-2.0

/**
 * RDTL calldata format encoder and decoder.
 *
 * Format v1:
 *   Bytes 0–3:  Magic  0x5244544C ("RDTL")
 *   Byte  4:    Version 0x01
 *   Bytes 5–36: SHA-256 hash (32 bytes)
 *   Total: 37 bytes
 *
 * See docs/on-chain-format.md for the full specification.
 */

/** The 4-byte magic prefix identifying RDTL calldata. */
export const RDTL_MAGIC = new Uint8Array([0x52, 0x44, 0x54, 0x4c]);

/** Current format version. */
export const RDTL_VERSION_1 = 0x01;

/** Total calldata length for version 1. */
export const RDTL_V1_LENGTH = 37;

export interface RdtlCalldata {
  version: number;
  /** 32-byte SHA-256 hash as a Uint8Array. */
  hash: Uint8Array;
}

/**
 * Encode a SHA-256 hash into RDTL v1 calldata.
 *
 * @param hash - 32-byte SHA-256 digest.
 * @returns 37-byte calldata payload.
 * @throws If the hash is not exactly 32 bytes.
 */
export function encodeCalldata(hash: Uint8Array): Uint8Array {
  if (hash.length !== 32) {
    throw new Error(`Expected 32-byte hash, got ${hash.length} bytes`);
  }

  const calldata = new Uint8Array(RDTL_V1_LENGTH);
  calldata.set(RDTL_MAGIC, 0);
  calldata[4] = RDTL_VERSION_1;
  calldata.set(hash, 5);
  return calldata;
}

/**
 * Decode RDTL calldata into its components.
 *
 * @param calldata - Raw calldata bytes (at least 37 bytes for v1).
 * @returns Parsed calldata with version and hash.
 * @throws If the magic bytes are wrong, the payload is too short,
 *         or the version is unrecognized.
 */
export function decodeCalldata(calldata: Uint8Array): RdtlCalldata {
  if (calldata.length < 5) {
    throw new Error(`Calldata too short: ${calldata.length} bytes (minimum 5)`);
  }

  // Check magic bytes.
  for (let i = 0; i < 4; i++) {
    if (calldata[i] !== RDTL_MAGIC[i]) {
      throw new Error(
        `Invalid magic bytes: expected 0x5244544C, got 0x${bytesToHex(calldata.slice(0, 4))}`
      );
    }
  }

  const version = calldata[4];

  if (version === RDTL_VERSION_1) {
    if (calldata.length < RDTL_V1_LENGTH) {
      throw new Error(
        `Calldata too short for v1: ${calldata.length} bytes (expected ${RDTL_V1_LENGTH})`
      );
    }
    const hash = calldata.slice(5, 37);
    return { version, hash };
  }

  throw new Error(`Unrecognized RDTL version: 0x${version.toString(16).padStart(2, '0')}`);
}

/**
 * Encode a calldata payload as a hex string with 0x prefix.
 */
export function calldataToHex(calldata: Uint8Array): string {
  return '0x' + bytesToHex(calldata);
}

/**
 * Decode a hex string (with or without 0x prefix) to bytes.
 */
export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') || hex.startsWith('0X') ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) {
    throw new Error('Hex string must have even length');
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
