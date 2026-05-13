// SPDX-License-Identifier: Apache-2.0

/**
 * Example: generate a test vector for the Redtail verification flow.
 * Usage: npx tsx index.ts
 */

import { canonicalizeMetadata, computeRecordHash, sha256 } from '../../src/hash/canonical';
import { encodeCalldata, calldataToHex } from '../../src/format/calldata';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function main() {
  const metadata = {
    title: 'Example Artwork',
    category: 'painting',
    year: 2025,
    medium: 'Oil on canvas',
  };

  const mediaContent = new TextEncoder().encode('example-media-file-content');
  const mediaHash = await sha256(mediaContent);
  const recordHash = await computeRecordHash(metadata, [mediaHash]);
  const calldata = encodeCalldata(recordHash);

  const input = {
    description: 'Auto-generated test vector.',
    metadata,
    mediaFiles: [
      {
        filename: 'example.txt',
        contentHex: bytesToHex(mediaContent),
      },
    ],
  };

  const expected = {
    valid: true,
    canonicalMetadataJson: canonicalizeMetadata(metadata),
    mediaSha256Hex: bytesToHex(mediaHash),
    recordHashHex: bytesToHex(recordHash),
    calldataHex: calldataToHex(calldata),
  };

  console.log('--- input.json ---');
  console.log(JSON.stringify(input, null, 2));
  console.log('\n--- expected.json ---');
  console.log(JSON.stringify(expected, null, 2));
}

main();
