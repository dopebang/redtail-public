# Protocol Notes

This document specifies the data formats, canonicalization rules, and versioning conventions used in Redtail's verification layer.

## Calldata format

### Version 1 (current)

Every anchoring transaction carries a calldata payload with the following structure:

| Offset | Length | Field | Value |
|--------|--------|-------|-------|
| 0 | 4 bytes | Magic | `0x5244544C` (ASCII "RDTL") |
| 4 | 1 byte | Version | `0x01` |
| 5 | 32 bytes | Hash | SHA-256 digest |

Total: 37 bytes.

The magic bytes identify the transaction as a Redtail anchor.
The version byte allows future format evolution without ambiguity.
The hash is the SHA-256 digest of the canonical record content (see below).

### Encoding

```
calldata = 0x5244544C || 0x01 || sha256_hash
```

Where `||` denotes byte concatenation.

### Decoding

1. Verify the first 4 bytes are `0x5244544C`. If not, this is not a Redtail anchor.
2. Read byte 4 as the version. If the version is not recognized, stop (forward compatibility).
3. Read bytes 5–36 as the 32-byte SHA-256 hash.

### Future versions

Version `0x02` is reserved for a format that includes a COSE_Sign1 envelope.
The structure would be:

| Offset | Length | Field |
|--------|--------|-------|
| 0 | 4 bytes | Magic `0x5244544C` |
| 4 | 1 byte | Version `0x02` |
| 5 | 2 bytes | Payload length (big-endian uint16) |
| 7 | variable | COSE_Sign1 structure |

This is a draft proposal and has not been implemented.

## Hash computation

### Input

The hash input is the concatenation of:

1. **Canonical metadata** — a deterministic JSON serialization of the record's structured fields.
2. **Media hashes** — the SHA-256 hashes of all associated media files, concatenated in sort order.

```
hash_input = canonical_metadata_bytes || media_hash_1 || media_hash_2 || ... || media_hash_n
```

### Canonical metadata format

The metadata is serialized as a JSON object with the following rules:

1. Keys are sorted lexicographically (Unicode code point order).
2. No whitespace between tokens (no spaces after `:` or `,`).
3. Strings are UTF-8 encoded.
4. Numbers are represented in their shortest decimal form (no trailing zeros, no leading zeros except for `0.x`).
5. Null values are omitted (the key is excluded, not serialized as `null`).
6. Nested objects follow the same rules recursively.
7. Arrays preserve their order; elements are not sorted.

This is equivalent to `JSON.stringify(obj, Object.keys(obj).sort())` with a recursive key-sorting step, excluding null-valued keys.

**Example:**

Input metadata:
```json
{
  "title": "Untitled #7",
  "category": "painting",
  "year": 2024,
  "medium": null,
  "dimensions": {"height": 120, "width": 80, "unit": "cm"}
}
```

Canonical form:
```json
{"category":"painting","dimensions":{"height":120,"unit":"cm","width":80},"title":"Untitled #7","year":2024}
```

Note: `medium` is omitted (null value). Keys are sorted at every level.

### Media hash computation

Each media file's SHA-256 hash is computed over the raw file bytes as stored.
No normalization or transcoding is applied to the media before hashing.
The hash is represented as 32 raw bytes (not hex-encoded) in the concatenation.

Media files are ordered by their `sortOrder` field (ascending).
If two files have the same `sortOrder`, they are ordered by their `storagePath` (lexicographic, ascending).

### Final hash

```
final_hash = SHA-256(canonical_metadata_bytes || media_hash_1 || ... || media_hash_n)
```

Where `canonical_metadata_bytes` is the UTF-8 encoding of the canonical JSON string.

## Claim format

Redtail does not currently define a standalone claim format (e.g., a JSON document representing a complete verifiable claim).
The "claim" is implicit: it is the combination of the record metadata, media files, and on-chain anchor.

A future version may define an explicit claim format, likely aligned with COSE_Sign1 payloads or W3C VC serialization.

## Receipt format

The current verification receipt is an ad-hoc structure returned by the verification endpoint:

```json
{
  "recordId": "clx...",
  "txHash": "0xabc...",
  "blockNumber": 18402117,
  "chainId": "8453",
  "status": "confirmed",
  "anchoredAt": "2026-03-12T14:23:00Z",
  "calldataHex": "0x5244544c01..."
}
```

This is not a signed receipt. It is not portable. It depends on trust in the endpoint.
Structuring this as a SCITT receipt or a COSE-signed receipt is planned.

## Key discovery

There is currently no formal key discovery mechanism.
The notary wallet address is known to the operator and can be published (e.g., in the repository, on the website, or in a DID document).
A verifier who knows the expected notary address can check the `from` field of the anchoring transaction.

Planned: publish the notary address as `did:pkh:eip155:8453:0x…` with a resolution path.

## Versioning

- **Calldata format version:** encoded in byte 4 of the calldata. Currently `0x01`.
- **Hash algorithm:** implied by the version. Version `0x01` always means SHA-256. Future versions may include an algorithm identifier.
- **Schema version:** the Prisma schema evolves with migrations. The public mirror includes a snapshot; it does not track migration history.
