# Standards Map

This document maps Redtail's current implementation against relevant IETF and W3C standards, identifies gaps, and recommends a primary engagement path for standards work.

## IETF standards (primary)

### SCITT — Supply Chain Integrity, Transparency, and Trust

**RFC 9711** (SCITT Architecture) defines an architecture where issuers produce signed statements about artifacts, transparency services register those statements and issue receipts, and verifiers check receipts against a transparency log.

**Redtail's relationship to SCITT:**

| SCITT concept | Redtail equivalent | Gap |
|---------------|-------------------|-----|
| Signed Statement | SHA-256 hash anchored as calldata | No signature. The hash is unsigned. Redtail would need to wrap it in a COSE_Sign1 envelope to produce a Signed Statement. |
| Transparency Service | Redtail notary + Base L2 | The blockchain serves as an append-only log, but there is no registration policy, no feed, and no SCITT-defined API. |
| Receipt | Ad-hoc receipt (txHash + block + chain) | Not structured as a SCITT receipt. No countersignature by the transparency service. |
| Issuer identity | Notary wallet address (EOA) | No DID binding, no key discovery, no certificate chain. |
| Artifact | Record (media + metadata) | Conceptually equivalent. |

**Implementation questions for SCITT adoption:**

1. What is the minimum viable SCITT implementation for a single-operator transparency service?
2. Can the blockchain anchor serve as the transparency log, or must a separate log structure be maintained?
3. What is the practical cost (code, dependencies, message size) of wrapping the current hash in a COSE_Sign1 envelope?
4. How should a small operator handle the SCITT registration policy requirement?

**Potential contribution:** An implementer report titled "Adopting SCITT in a single-operator, blockchain-anchored verification system" documenting the adoption cost, format choices, and remaining gaps.

### COSE — CBOR Object Signing and Encryption

**RFC 9052** defines COSE structures for signing, encrypting, and MACing CBOR data.

**Relevance:** The natural next step for Redtail is to wrap the SHA-256 hash in a `COSE_Sign1` structure before anchoring.
This would make the hash self-authenticating: a verifier could confirm that the hash was produced by the notary without trusting the transport.

**Gap:** Redtail currently does not use CBOR or COSE.
The hash is a raw 32-byte value in the calldata.
Adopting COSE_Sign1 requires:

- A CBOR encoding library.
- Choosing a COSE algorithm identifier (e.g., ES256 for the notary's secp256k1 key — noting that secp256k1 is not a registered COSE algorithm; this is itself a standards question).
- Encoding the hash as the COSE payload.
- Fitting the resulting COSE_Sign1 structure into the calldata format.

**Implementation questions:**

1. secp256k1 (the Ethereum key type) is not a registered COSE algorithm. Should the implementation use a different key type for COSE signing, or register secp256k1?
2. What is the overhead (bytes) of a COSE_Sign1 envelope over a raw 32-byte hash?
3. Should the COSE header include the notary's public key, or should key discovery be separate?

**Potential contribution:** Test vectors for COSE_Sign1 over a SHA-256 hash with an Ethereum-derived key.

### HTTP Message Signatures

**RFC 9421** defines a mechanism for signing HTTP messages (requests and responses).

**Relevance:** The verification endpoint (`/v/{txHash}`) returns record data over HTTP.
Signing the response with RFC 9421 would allow:

- Offline verification of cached or proxied responses.
- Third-party reliance on the endpoint's output without live blockchain access.
- A concrete, small-scope implementation exercise producing test vectors.

**Gap:** The endpoint currently serves unsigned responses over HTTPS (TLS only).

**Implementation questions:**

1. Which response components should be covered by the signature? (status, content-type, body, content-digest)
2. Should the signing key be the same as the notary wallet key, or a separate HTTP-specific key?
3. How should `keyid` in the Signature-Input resolve — via a `/.well-known/` endpoint, a DID, or an inline JWK?

**Potential contribution:** An interoperability note on RFC 9421 response signing for a verification endpoint, with test vectors.

### Verification receipts

Several IETF drafts discuss receipt formats for transparency services, notably in the SCITT working group.

**Relevance:** Redtail's current "receipt" is an ad-hoc set of fields: `txHash`, `blockNumber`, `chainId`, `status`.
Structuring this as a standard receipt format would make it portable, machine-readable, and interoperable.

**Gap:** No structured receipt format. No countersignature.

**Potential contribution:** A proposed receipt structure based on SCITT receipt drafts, with test vectors showing the current ad-hoc receipt alongside the structured equivalent.

## W3C standards (secondary)

### Verifiable Credentials Data Model 2.0

A Redtail record with its event chain can be modeled as a Verifiable Credential:

| VC concept | Redtail equivalent |
|------------|-------------------|
| Issuer | Operator / notary wallet |
| Subject | The physical asset (record) |
| Claim | Record metadata + media hashes |
| Proof | On-chain anchor (txHash) |
| Credential status | Record status (active, archived, transferred) |

**Gap:** Redtail does not produce VC-formatted output.
The record is stored in a relational database, not as a JSON-LD document.
Adopting VC format would require serialization logic and a decision on proof type (`EthereumEip712Signature2021`, `DataIntegrityProof`, or a custom type referencing the on-chain anchor).

**Implementation question:** Is the on-chain anchor a valid VC proof type, or does it need to be wrapped in a recognized proof format?

### Decentralized Identifiers (DIDs)

The notary wallet address can be expressed as `did:pkh:eip155:8453:0x…` (using the `did:pkh` method for blockchain account identifiers).

**Relevance:** This provides a standards-compatible identifier for the notary without requiring a new DID method.

**Gap:** No DID document is published. No key discovery mechanism. The `did:pkh` method is a notation convenience, not a full DID implementation.

### C2PA (Content Provenance)

C2PA (ISO 22144) is an asset-bytes-centric provenance standard: it embeds provenance metadata directly into media files (images, video, documents).

**Comparison:**

| Aspect | C2PA | Redtail |
|--------|------|---------|
| Unit of provenance | Individual media file | Record (bundle of media + metadata) |
| Provenance storage | Embedded in file (manifest) | External (database + blockchain anchor) |
| Signing | COSE_Sign1 over manifest | Unsigned hash (currently) |
| Verification | Parse the file, extract manifest, verify signature | Query blockchain, recompute hash, compare |
| Scope | Digital content authenticity | Physical asset record integrity |

**Gap:** Redtail does not embed provenance in media files.
The two systems are complementary: C2PA could handle per-file provenance, while Redtail handles record-level provenance for a bundle of files and metadata.

## Standards gaps identified

1. **secp256k1 in COSE.** Ethereum's key type is not a registered COSE algorithm. This is a practical barrier for any Ethereum-adjacent system adopting COSE.
2. **On-chain anchors as VC proofs.** The W3C VC data model does not define a proof type for on-chain transaction anchors. A custom proof type or an extension would be needed.
3. **Receipt format for blockchain-anchored transparency.** SCITT receipts assume a specific log structure. How to represent a blockchain anchor (txHash + blockNumber + chainId) as a SCITT receipt is not defined.
4. **Key discovery for blockchain notaries.** There is no standard for resolving an Ethereum address to a set of verification capabilities (signing algorithms, anchoring format versions, service endpoints).
5. **Canonicalization for mixed media + metadata.** Existing canonicalization standards (JCS for JSON, C14N for XML) do not address the case of canonical hashing over structured metadata plus binary media files.

## Recommendation for primary standards path

**IETF, led by SCITT/COSE and HTTP Message Signatures.**

The IETF path offers the most concrete, small-scope implementation exercises that produce reusable outputs (test vectors, interop notes, implementer reports).
The W3C path (VCs, DIDs) is longer-reach and higher-overhead; it should be tracked as a secondary surface but not the primary engagement target.

The recommended sequence of standards work:

1. COSE_Sign1 wrapping of the SHA-256 hash (smallest scope, highest signal).
2. RFC 9421 signing of verification endpoint responses (concrete, testable, produces test vectors).
3. SCITT alignment gap analysis (requires 1 and 2 as prerequisites; produces the most valuable implementer report).
4. W3C VC modeling as a conformance exercise (depends on the above; produces a comparison document).
