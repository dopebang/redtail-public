# Verification Flow

This document describes the end-to-end lifecycle of a Redtail record: creation, hashing, anchoring, verification, and failure cases.

## Happy path

### 1. Record creation

The operator (or an authorized user) creates a record by providing:

- One or more media files (photographs, documents).
- Structured metadata: title, category, description, and category-specific fields.

The client computes the SHA-256 hash of each media file before upload.
The server receives the media, stores it, and independently recomputes the SHA-256 hash.
If the client-asserted hash and server-computed hash do not match, the media is rejected.

### 2. Canonical hashing

The hashing engine produces a single 32-byte SHA-256 hash from:

```
SHA-256(canonical_metadata || media_sha256_1 || media_sha256_2 || ... || media_sha256_n)
```

Where `canonical_metadata` is the JSON representation of the record's metadata, serialized in a deterministic order (keys sorted lexicographically, no whitespace).
See [Protocol Notes](protocol-notes.md) for the canonicalization specification.

The media hashes are concatenated in the order they were added to the record (sorted by `sortOrder`).

### 3. Calldata encoding

The 32-byte hash is wrapped in the RDTL calldata format:

```
0x5244544C   (4 bytes — magic "RDTL")
0x01         (1 byte — version)
<hash>       (32 bytes — SHA-256)
```

Total payload: 37 bytes.

### 4. On-chain anchoring

The notary wallet sends a self-send transaction on Base L2:

- **To:** notary wallet address (self-send; value = 0).
- **Data:** the 37-byte calldata payload.
- **Gas:** standard Base L2 gas for a simple transaction with calldata.

The API returns the `txHash` immediately (optimistic).
The `txHash` is the permanent identifier for this anchor.

### 5. Confirmation

The background confirmation worker polls the blockchain for the transaction receipt.
Once confirmed:

- The database is updated with `blockNumber` and `confirmedAt`.
- The record status transitions from "pending confirmation" to "confirmed."

### 6. Verification

A verifier accesses the public endpoint `/v/{txHash}` and receives:

- Record metadata (title, category, description, fields).
- Media file references with their SHA-256 hashes.
- Anchor details: `txHash`, `blockNumber`, `chainId`, `calldataHex`.

The verifier can then:

1. **Recompute the hash.** Download the media files, compute their SHA-256 hashes, canonicalize the metadata, and compute `SHA-256(canonical_metadata || media_hashes)`.
2. **Compare against the anchor.** Decode the calldata from the on-chain transaction and extract the 32-byte hash. Compare with the recomputed hash.
3. **Confirm the transaction.** Query the blockchain directly to verify the transaction exists, was sent from the expected notary address, and contains the expected calldata.

If all three checks pass, the record is verified.

## Failure cases

### Hash mismatch — metadata tampered

**Scenario:** The record metadata in the database has been modified after anchoring.

**Detection:** The verifier recomputes the hash from the (modified) metadata and original media.
The recomputed hash does not match the hash in the on-chain calldata.

**Verifier action:** Reject the record. The metadata cannot be trusted.

### Hash mismatch — media substituted

**Scenario:** A media file has been replaced in storage with a different file.

**Detection:** The verifier downloads the media file and computes its SHA-256 hash.
The hash does not match the `RecordMedia.sha256` value, and consequently the aggregate hash does not match the on-chain anchor.

**Verifier action:** Reject the record. The media cannot be trusted.

### Transaction not found

**Scenario:** The `txHash` does not correspond to a confirmed transaction on the expected chain.

**Possible causes:**

- The transaction was never broadcast (system failure).
- The transaction was broadcast but reverted.
- The `txHash` is fabricated.
- The verifier is querying the wrong chain.

**Verifier action:** The record cannot be verified. Treat as unanchored.

### Wrong sender

**Scenario:** The transaction exists but was not sent from the expected notary wallet address.

**Detection:** The verifier checks the `from` field of the transaction.

**Possible causes:**

- The notary wallet was rotated (if rotation is implemented in the future).
- The transaction was sent by a different party.

**Verifier action:** If the sender is not a recognized notary address, the anchor is not authoritative.

### Malformed calldata

**Scenario:** The transaction calldata does not start with `0x5244544C` or contains an unrecognized version byte.

**Detection:** The calldata decoder rejects the input.

**Verifier action:** The record cannot be verified against this transaction. Treat as unanchored.

## Key rotation (planned)

Key rotation is not currently implemented. When implemented:

1. A rotation announcement transaction will be broadcast from the old notary wallet, containing the new wallet address.
2. After the rotation, new anchors will come from the new wallet.
3. Verifiers will need to check both the current and previous notary addresses, or consult a registry of valid notary addresses.

The rotation mechanism is described in the [Roadmap](../ROADMAP.md).

## Revocation and expiry

Redtail does not currently support on-chain revocation or expiry.

- **Application-level revocation:** A record can be marked as `ARCHIVED` or `SUSPENDED` in the database. The verification endpoint will reflect this status. However, the on-chain anchor remains; a verifier with direct blockchain access can still see the original anchor.
- **On-chain revocation (planned):** A future version may support a revocation transaction that marks an anchor as revoked. This is documented in the [Roadmap](../ROADMAP.md).
- **Expiry:** Records do not expire. The on-chain anchor is permanent.
