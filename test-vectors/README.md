# Test Vectors

This directory contains test vectors for the Redtail verification flow.
Each test vector is a self-contained input/output pair that any independent implementation should be able to reproduce.

## Directory structure

```
test-vectors/
├── README.md           (this file)
└── v1/                 (calldata format version 1)
    ├── valid/
    │   └── 01-minimal/
    │       ├── input.json
    │       └── expected.json
    └── invalid/
        └── 01-tampered-media/
            ├── input.json
            └── expected.json
```

## Format

### `input.json`

```json
{
  "metadata": { ... },
  "mediaFiles": [
    {
      "filename": "photo.jpg",
      "contentHex": "ffd8ffe0...",
      "sha256Hex": "abc123..."
    }
  ]
}
```

- `metadata`: the record's structured metadata (will be canonicalized).
- `mediaFiles`: ordered list of media files. `contentHex` is the hex-encoded file bytes; `sha256Hex` is the expected SHA-256 hash of those bytes.

### `expected.json`

```json
{
  "valid": true,
  "canonicalMetadataJson": "{\"category\":\"painting\",...}",
  "recordHashHex": "def456...",
  "calldataHex": "0x5244544c01def456..."
}
```

For invalid test vectors:

```json
{
  "valid": false,
  "reason": "Hash mismatch: media has been substituted."
}
```

## How to use

1. Parse `input.json`.
2. Decode `contentHex` for each media file.
3. Compute SHA-256 of each media file; compare against `sha256Hex`.
4. Canonicalize `metadata` per the rules in `docs/protocol-notes.md`.
5. Compute the aggregate record hash.
6. If `expected.valid` is `true`, the computed hash should match `expected.recordHashHex`, and encoding it as calldata should produce `expected.calldataHex`.
7. If `expected.valid` is `false`, the verification should fail for the stated reason.

## Contributing test vectors

Contributions of additional test vectors are welcome.
Especially valuable: edge cases in canonicalization (Unicode, large numbers, deeply nested objects), large media files, multiple media files, and cross-implementation comparison vectors.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.
