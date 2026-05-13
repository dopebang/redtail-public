// SPDX-License-Identifier: Apache-2.0

/**
 * Headless verifier for Redtail records.
 *
 * Given record metadata, media file bytes, and on-chain calldata,
 * this module verifies that the record has not been tampered with
 * since anchoring.
 *
 * This module has no framework dependencies. It can be used in
 * Node.js, Deno, browsers, or any environment with Web Crypto API.
 */

import { decodeCalldata } from '../format/calldata';
import { computeRecordHash, sha256 } from '../hash/canonical';

export type VerificationResult =
  | { valid: true }
  | { valid: false; reason: string };

export interface VerificationInput {
  /** The record's structured metadata (will be canonicalized). */
  metadata: Record<string, unknown>;

  /**
   * Media file bytes, in sort order (by sortOrder, then storagePath).
   * Each entry is the raw file content as a Uint8Array.
   */
  mediaFiles: Uint8Array[];

  /**
   * The raw calldata bytes from the on-chain transaction.
   * Can be obtained by fetching the transaction and reading its `input` field.
   */
  calldata: Uint8Array;
}

/**
 * Verify a Redtail record against its on-chain anchor.
 *
 * Steps:
 * 1. Decode the calldata and extract the anchored hash.
 * 2. Compute SHA-256 hashes of each media file.
 * 3. Compute the aggregate record hash from canonical metadata + media hashes.
 * 4. Compare the computed hash against the anchored hash.
 *
 * @returns A result indicating whether the record is valid, and if not, why.
 */
export async function verify(input: VerificationInput): Promise<VerificationResult> {
  // Step 1: Decode calldata.
  let anchoredHash: Uint8Array;
  try {
    const decoded = decodeCalldata(input.calldata);
    anchoredHash = decoded.hash;
  } catch (err) {
    return {
      valid: false,
      reason: `Calldata decode failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Step 2: Hash each media file.
  const mediaHashes: Uint8Array[] = [];
  for (let i = 0; i < input.mediaFiles.length; i++) {
    try {
      const hash = await sha256(input.mediaFiles[i]);
      mediaHashes.push(hash);
    } catch (err) {
      return {
        valid: false,
        reason: `Failed to hash media file at index ${i}: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // Step 3: Compute aggregate hash.
  let computedHash: Uint8Array;
  try {
    computedHash = await computeRecordHash(input.metadata, mediaHashes);
  } catch (err) {
    return {
      valid: false,
      reason: `Hash computation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Step 4: Compare.
  if (computedHash.length !== anchoredHash.length) {
    return {
      valid: false,
      reason: `Hash length mismatch: computed ${computedHash.length} bytes, anchored ${anchoredHash.length} bytes`,
    };
  }

  for (let i = 0; i < computedHash.length; i++) {
    if (computedHash[i] !== anchoredHash[i]) {
      return {
        valid: false,
        reason: 'Hash mismatch: the computed hash does not match the anchored hash. The record metadata or media may have been modified since anchoring.',
      };
    }
  }

  return { valid: true };
}
