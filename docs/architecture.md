# Architecture

## Overview

Redtail Open Verifier is a record-and-verify system for structured public records.
A publisher creates a record containing metadata and media references, and the system anchors or timestamps an integrity proof of that record.
Any third party with access to the original media and metadata can independently recompute the hash and verify it against the published proof.

This document describes the architectural goals, components, data flow, trust boundaries, and limitations.

## Architectural goals

1. **Independently verifiable.** A verifier must be able to confirm a record's integrity without trusting the Redtail operator or platform. The on-chain anchor is the root of trust.
2. **Append-only record history.** Once an event is recorded and anchored, it cannot be modified or deleted. The event log for a record is strictly append-only.
3. **Content-addressable media.** Every media file is identified by its SHA-256 hash. If the bytes change, the hash changes, and the verification fails.
4. **Self-hostable.** A motivated operator should be able to run the full stack independently. No hard dependency on a proprietary service.
5. **Standards-ready.** The architecture should not preclude adoption of COSE_Sign1, HTTP Message Signatures, SCITT receipts, or W3C VCs. The current unsigned-hash model is the simplest viable starting point; the architecture is designed to accept a signing layer without structural changes.

## Components

### Record store

A PostgreSQL database (via Prisma ORM) holding records, events, media references, field values, and category definitions.
The schema is described in [Data Model](data-model.md).

### Hashing engine

Computes the SHA-256 hash over canonical metadata and media bytes.
The canonical form is defined in [Protocol Notes](protocol-notes.md).
The hash is deterministic: the same input always produces the same output.

### Calldata encoder

Transforms the 32-byte SHA-256 hash into the anchoring payload:

```
0x5244544C   (4 bytes, magic "RDTL")
0x01         (1 byte, version)
<hash>       (32 bytes, SHA-256)
```

See [On-Chain Format](on-chain-format.md) for the full specification.

### Notary wallet

An Ethereum-compatible wallet (EOA) controlled by the operator.
The notary wallet sends a self-send transaction on Base L2 with the calldata payload.
The transaction hash (`txHash`) becomes the permanent anchor identifier.

**Trust boundary:** the notary wallet is a single point of trust.
Whoever controls the private key can anchor arbitrary data.
See [Threat Model](threat-model.md#key-compromise).

### Confirmation worker

A background process that polls the blockchain for transaction confirmation.
When a transaction is confirmed, the worker updates the database record with the block number and confirmation timestamp.
The API returns the `txHash` immediately (optimistic); the worker confirms asynchronously.

### Verification endpoint

A public HTTP endpoint (`/v/{txHash}`) that:

1. Looks up the record associated with the given `txHash`.
2. Returns the record metadata, media references, and the on-chain anchor details.
3. Allows any party to recompute the hash and compare.

The endpoint currently returns data over HTTPS.
It does not sign the response payload (no RFC 9421).
This is a known limitation; see [Roadmap](../ROADMAP.md).

## Data flow

```
1. Operator creates a record:
   - Uploads media (photos, documents).
   - Provides structured metadata (title, category, fields).

2. Hashing engine computes SHA-256:
   - Canonicalizes metadata.
   - Hashes: SHA-256(canonical_metadata || media_bytes).

3. Calldata encoder wraps the hash:
   - Produces: 0x5244544C + 0x01 + <32-byte hash>.

4. Notary wallet sends a self-send transaction on Base L2:
   - To: notary wallet address (self-send).
   - Value: 0.
   - Data: the encoded calldata.
   - Returns: txHash (immediate, optimistic).

5. Confirmation worker polls for confirmation:
   - Updates the database with block number and timestamp.

6. Verification endpoint serves the record:
   - Any party can retrieve the record via /v/{txHash}.
   - Any party can recompute the hash and compare against chain.
```

## Trust boundaries

| Boundary | Trust assumption |
|----------|-----------------|
| Notary wallet | Operator controls the private key. A key compromise allows fraudulent anchoring. |
| Base L2 blockchain | The L2 sequencer and settlement layer are honest. Transaction finality depends on L2 guarantees. |
| Record store (database) | The database is trusted for availability but not for integrity; the on-chain anchor is the integrity root. |
| Verification endpoint | The endpoint is trusted for transport (TLS) but not for payload integrity (no response signing). |
| Media storage (Supabase) | The storage layer is trusted for availability. Media integrity is verified by SHA-256 comparison against the anchored hash. |

## Deployment model

The production system runs as:

- A Next.js application on Vercel (compute).
- PostgreSQL on Supabase (database).
- Supabase Storage (media).
- Base L2 (blockchain anchoring).
- A background worker process for transaction confirmation.

For self-hosting, the components are: any Node.js host, any PostgreSQL instance, any S3-compatible object storage, and an Ethereum JSON-RPC endpoint for Base L2.

## Extensibility

The architecture is designed to accept the following additions without structural changes:

- **Signing layer.** A COSE_Sign1 or JWS envelope can wrap the SHA-256 hash before anchoring. The calldata format version byte allows distinguishing signed and unsigned payloads.
- **Additional hash algorithms.** The version byte and a potential algorithm identifier field in a v2 format can support SHA-384, SHA-512, or BLAKE3.
- **Multiple notaries.** The notary wallet can be replaced by a multi-sig or a set of independent notaries, each anchoring independently.
- **Receipt format.** The ad-hoc verification receipt can be replaced with a structured SCITT receipt or COSE receipt without changing the anchoring model.
- **Federation.** Multiple Redtail instances can cross-verify by sharing `txHash` references and recomputing hashes independently.

## Limitations

- **Single notary.** The current system has one notary wallet. There is no multi-sig, threshold signing, or notary rotation.
- **No signed statements.** The anchored data is an unsigned hash. The identity of the issuer is inferred from the transaction sender, not from a cryptographic signature over the claim.
- **No key discovery.** There is no published mechanism for a verifier to discover the notary's public key or verify its binding to the operator's identity.
- **No revocation.** Records cannot be revoked or marked as invalid on-chain. Revocation is application-level only.
- **L2 finality.** Transaction finality depends on the L2's challenge period (for optimistic rollups). Redtail does not expose finality status to the verifier.
