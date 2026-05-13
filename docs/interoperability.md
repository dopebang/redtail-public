# Interoperability

This document describes how Redtail can interoperate with other systems, what should be standardizable, and how to prepare interoperability tests.

## Interoperability surfaces

### 1. Calldata format

The RDTL calldata format (`0x5244544C` + version + hash) is the most concrete interoperability surface.
Any system that can read EVM transaction calldata can parse a Redtail anchor.

**What is standardizable:** The 37-byte format (magic + version + SHA-256 hash) could be published as a minimal specification with test vectors, allowing independent implementations to encode and decode anchors.

**Interop test:** Given a `txHash` on Base L2, an independent implementation should be able to:

1. Fetch the transaction calldata via any Ethereum JSON-RPC endpoint.
2. Parse the RDTL prefix and extract the hash.
3. Compare the hash against a recomputed value.

### 2. Hash computation

The canonical hashing algorithm (sorted-key JSON + ordered media SHA-256 concatenation) is the second interoperability surface.

**What is standardizable:** The canonicalization rules and the hash input construction.
Given the same metadata JSON and media files, any independent implementation should produce the same 32-byte hash.

**Interop test:** The `test-vectors/` directory provides input/output pairs.
An independent implementation should produce identical hashes for all valid test vectors and reject all invalid ones.

**Open question:** The current canonicalization is a custom JSON sort.
If Redtail adopts JCS (RFC 8785 — JSON Canonicalization Scheme), the hash computation becomes more interoperable but may change the canonical form for existing records.
This is a breaking change that would require a new calldata version.

### 3. Verification endpoint

The `/v/{txHash}` endpoint returns a JSON response with record metadata, media references, and anchor details.

**What is standardizable:** The response schema.
An independent verifier client should be able to consume the endpoint response and perform verification without knowledge of Redtail's internal data model.

**Open question:** Should the response include a self-contained proof (e.g., a SCITT receipt or COSE structure), or should it only provide references that the verifier resolves independently?

### 4. Receipt format

If a structured receipt format is adopted (SCITT receipt, COSE receipt), the receipt itself becomes a portable interoperability artifact.
A receipt issued by one Redtail instance could be verified by another instance, or by a generic SCITT verifier, without any Redtail-specific knowledge.

**Open question:** What is the minimum viable receipt that is useful for interoperability?

## Cross-system interoperability scenarios

### Redtail ↔ Redtail (federation)

Two independent Redtail instances could cross-verify each other's records if they share:

1. The notary wallet addresses they recognize.
2. Access to the same blockchain (or a bridge between chains).
3. The same calldata format version.

No federation protocol is currently defined.
A minimal approach: each instance publishes its notary address and chain ID; cross-verification is performed by querying the other instance's chain.

### Redtail ↔ C2PA

C2PA embeds provenance in media files; Redtail stores provenance externally.
A bridge would:

1. Extract the SHA-256 hash from a C2PA manifest.
2. Compare it against the SHA-256 in a Redtail `RecordMedia` entry.

If the hashes match, the C2PA provenance and the Redtail record refer to the same media.
This does not establish equivalence of the claims — only that the media is the same.

### Redtail ↔ SCITT transparency service

If Redtail produces COSE_Sign1 statements and a SCITT-compatible receipt, a generic SCITT verifier could verify a Redtail record without any Redtail-specific code.
This is the strongest interoperability target and the primary goal of the standards track.

### Redtail ↔ W3C VC verifier

If Redtail exports records as W3C VCs (with an on-chain anchor proof type), a generic VC verifier could verify the credential.
This requires defining a proof type that references the blockchain anchor.

## Preparing interoperability tests

### Test vector format

Test vectors in `test-vectors/` should follow this structure:

```
test-vectors/v1/valid/01-minimal/
  input.json      — metadata + media file references
  media/          — actual media files (small test images)
  expected.json   — expected hash, expected calldata
```

An independent implementation should be able to:

1. Read `input.json`.
2. Compute the canonical hash.
3. Compare against `expected.json`.

### Cross-implementation testing protocol

To test interoperability between two implementations:

1. Implementation A produces a set of test vectors (input + expected output).
2. Implementation B processes the same inputs.
3. Compare outputs. Any mismatch indicates a canonicalization or hashing divergence.
4. Document divergences as interoperability notes.

### What to report

An interoperability report (filed as a GitHub issue using the Interoperability Report template) should include:

- The two implementations compared (name, version, language).
- The test vectors used.
- Pass/fail results per vector.
- For failures: the divergent output and a diagnosis of the cause.
- Whether the divergence is a bug, an ambiguity in the specification, or a legitimate difference in interpretation.
