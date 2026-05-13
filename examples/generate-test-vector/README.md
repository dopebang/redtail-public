# Example: Generate Test Vector

This example demonstrates how to generate a test vector for the Redtail verification flow.

## Usage

```bash
npx tsx index.ts
```

## What it does

1. Defines sample metadata and a small media file.
2. Computes the canonical metadata JSON.
3. Computes the SHA-256 hash of the media.
4. Computes the aggregate record hash.
5. Encodes the RDTL calldata.
6. Outputs `input.json` and `expected.json` suitable for inclusion in `test-vectors/`.
