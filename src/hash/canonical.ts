// SPDX-License-Identifier: Apache-2.0

/**
 * Canonical hashing for Redtail records.
 *
 * Computes a single SHA-256 digest over:
 *   canonical_metadata_bytes || media_hash_1 || ... || media_hash_n
 *
 * See docs/protocol-notes.md for the full specification.
 */

/**
 * Recursively sort object keys lexicographically and omit null/undefined values.
 * Arrays preserve their order; elements are processed recursively.
 */
export function canonicalizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    const value = obj[key];

    if (value === null || value === undefined) {
      continue; // Omit null/undefined values.
    }

    if (Array.isArray(value)) {
      sorted[key] = value.map((item) =>
        typeof item === 'object' && item !== null && !Array.isArray(item)
          ? canonicalizeObject(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === 'object') {
      sorted[key] = canonicalizeObject(value as Record<string, unknown>);
    } else {
      sorted[key] = value;
    }
  }

  return sorted;
}

/**
 * Serialize metadata to its canonical JSON form.
 * Keys sorted lexicographically at every level, nulls omitted, no whitespace.
 */
export function canonicalizeMetadata(metadata: Record<string, unknown>): string {
  return JSON.stringify(canonicalizeObject(metadata));
}

/**
 * Compute the aggregate SHA-256 hash for a record.
 *
 * @param metadata - The record's structured metadata (will be canonicalized).
 * @param mediaHashes - Ordered array of 32-byte SHA-256 hashes of media files.
 * @returns 32-byte SHA-256 digest as a Uint8Array.
 */
export async function computeRecordHash(
  metadata: Record<string, unknown>,
  mediaHashes: Uint8Array[]
): Promise<Uint8Array> {
  // Validate media hashes.
  for (let i = 0; i < mediaHashes.length; i++) {
    if (mediaHashes[i].length !== 32) {
      throw new Error(`Media hash at index ${i} is ${mediaHashes[i].length} bytes, expected 32`);
    }
  }

  const canonicalJson = canonicalizeMetadata(metadata);
  const metadataBytes = new TextEncoder().encode(canonicalJson);

  // Concatenate: metadata bytes || media hash 1 || media hash 2 || ...
  const totalLength = metadataBytes.length + mediaHashes.length * 32;
  const input = new Uint8Array(totalLength);

  let offset = 0;
  input.set(metadataBytes, offset);
  offset += metadataBytes.length;

  for (const mh of mediaHashes) {
    input.set(mh, offset);
    offset += 32;
  }

  // SHA-256 via Web Crypto API (available in Node.js >= 15 and all modern browsers).
  const digest = await crypto.subtle.digest('SHA-256', toArrayBuffer(input));
  return new Uint8Array(digest);
}

/**
 * Compute SHA-256 of raw bytes.
 * Utility for hashing individual media files.
 */
export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', toArrayBuffer(data));
  return new Uint8Array(digest);
}

/** Convert a Uint8Array to a plain ArrayBuffer (avoids SharedArrayBuffer type issues). */
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}
