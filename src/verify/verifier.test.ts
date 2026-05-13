// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect } from 'vitest';
import { verify } from './verifier';
import { encodeCalldata } from '../format/calldata';
import { computeRecordHash, sha256 } from '../hash/canonical';

async function buildValidInput() {
  const metadata = { category: 'painting', title: 'Test Painting', year: 2024 };
  const mediaContent = new TextEncoder().encode('fake-image-bytes');
  const mediaHash = await sha256(mediaContent);
  const recordHash = await computeRecordHash(metadata, [mediaHash]);
  const calldata = encodeCalldata(recordHash);
  return { metadata, mediaFiles: [mediaContent], calldata };
}

describe('verify', () => {
  it('returns valid for a correct record', async () => {
    const input = await buildValidInput();
    const result = await verify(input);
    expect(result.valid).toBe(true);
  });

  it('returns invalid when metadata is tampered', async () => {
    const input = await buildValidInput();
    input.metadata.title = 'Tampered Title';
    const result = await verify(input);
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.reason).toContain('Hash mismatch');
  });

  it('returns invalid when media is substituted', async () => {
    const input = await buildValidInput();
    input.mediaFiles = [new TextEncoder().encode('different-image-bytes')];
    const result = await verify(input);
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.reason).toContain('Hash mismatch');
  });

  it('returns invalid for malformed calldata', async () => {
    const input = await buildValidInput();
    input.calldata = new Uint8Array([0x00, 0x01, 0x02]);
    const result = await verify(input);
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.reason).toContain('Calldata decode failed');
  });

  it('returns invalid when calldata has wrong magic', async () => {
    const input = await buildValidInput();
    input.calldata[0] = 0xff;
    const result = await verify(input);
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.reason).toContain('Invalid magic bytes');
  });

  it('returns valid with no media files', async () => {
    const metadata = { title: 'No media record' };
    const recordHash = await computeRecordHash(metadata, []);
    const calldata = encodeCalldata(recordHash);
    const result = await verify({ metadata, mediaFiles: [], calldata });
    expect(result.valid).toBe(true);
  });

  it('returns valid with multiple media files', async () => {
    const metadata = { title: 'Multi media' };
    const media1 = new TextEncoder().encode('file-one');
    const media2 = new TextEncoder().encode('file-two');
    const hash1 = await sha256(media1);
    const hash2 = await sha256(media2);
    const recordHash = await computeRecordHash(metadata, [hash1, hash2]);
    const calldata = encodeCalldata(recordHash);
    const result = await verify({ metadata, mediaFiles: [media1, media2], calldata });
    expect(result.valid).toBe(true);
  });

  it('is sensitive to media order', async () => {
    const metadata = { title: 'Order matters' };
    const media1 = new TextEncoder().encode('file-one');
    const media2 = new TextEncoder().encode('file-two');
    const hash1 = await sha256(media1);
    const hash2 = await sha256(media2);

    // Hash computed with order [1, 2].
    const recordHash = await computeRecordHash(metadata, [hash1, hash2]);
    const calldata = encodeCalldata(recordHash);

    // Verify with order [2, 1] — should fail.
    const result = await verify({ metadata, mediaFiles: [media2, media1], calldata });
    expect(result.valid).toBe(false);
  });
});
