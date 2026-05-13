# Threat Model

## Scope

This threat model covers the Redtail verification layer: the flow from record creation through hash computation, on-chain anchoring, and public verification.
It does not cover the production application's authentication, billing, or admin surfaces, which are not part of this public mirror.

## Assets

| Asset | Description |
|-------|-------------|
| Record integrity | The guarantee that a record's metadata and media have not been altered since anchoring. |
| Anchor immutability | The guarantee that the on-chain calldata cannot be modified after inclusion in a confirmed block. |
| Notary private key | The key material that authorizes anchoring transactions. |
| Verification endpoint availability | The ability of a verifier to retrieve record data and compare it against the anchor. |
| Media file integrity | The guarantee that media bytes match the SHA-256 hash stored and anchored. |

## Actors

| Actor | Description | Trust level |
|-------|-------------|-------------|
| Operator | Runs the Redtail instance, controls the notary wallet, manages records. | Trusted for system operation. Single point of trust for anchoring. |
| Record creator | A user (or the operator) who creates a record and provides media/metadata. | Semi-trusted. The system records what they provide; it does not verify the truth of the metadata. |
| Verifier | Any third party who checks a record against its on-chain anchor. | Untrusted. The system must provide enough information for independent verification. |
| Blockchain (L2) | Base L2 sequencer and settlement layer. | Trusted for transaction ordering and finality within L2 guarantees. |
| Storage provider | Supabase or any S3-compatible store hosting media files. | Trusted for availability. Not trusted for integrity (SHA-256 provides integrity). |

## Attacks in scope

### Key compromise

**Attack:** An adversary obtains the notary private key.

**Impact:** The adversary can send self-send transactions from the notary wallet with arbitrary calldata. This allows anchoring fabricated hashes indistinguishable from legitimate ones. All future anchors become untrustworthy. Past anchors (before compromise) remain valid if the adversary did not have historical access.

**Mitigation (current):** Operational security — the key is stored as an environment variable, not committed to the repository. MFA on hosting accounts.

**Mitigation (planned):** Key rotation mechanism with on-chain announcement. Multi-notary support. HSM or secure enclave key storage.

**Residual risk:** High. The single-notary model is the primary systemic risk.

### Replay attack

**Attack:** An adversary resubmits a previously valid anchoring transaction.

**Impact:** Limited. A replayed self-send transaction on EVM would produce a different `txHash` (different nonce), so the anchored hash would exist at a new transaction. The original anchor remains valid. The replay creates a duplicate anchor, not a forgery.

**Mitigation:** The nonce mechanism in EVM prevents literal transaction replay. Duplicate hash detection at the application level can flag suspicious patterns.

**Residual risk:** Low.

### Signature substitution

**Attack:** An adversary replaces the hash in the calldata before the transaction is broadcast.

**Impact:** If the adversary can intercept the transaction between the application and the RPC endpoint, they can substitute the hash. The anchored hash would not match the original record.

**Mitigation (current):** TLS between the application and the RPC endpoint. The hash is computed server-side and sent directly.

**Mitigation (planned):** COSE_Sign1 envelope over the hash, signed by the notary key, would make the hash self-authenticating. A verifier could detect substitution even without trusting the transport.

**Residual risk:** Medium. Without a signed envelope, a compromised RPC endpoint or MITM could substitute the hash.

### Metadata tampering

**Attack:** An adversary modifies the record metadata in the database after anchoring.

**Impact:** The modified metadata would produce a different hash when recomputed. A verifier performing the full recomputation would detect the mismatch. However, a verifier who trusts the application's claimed metadata without recomputing would be deceived.

**Mitigation:** The verification endpoint exposes enough information for independent recomputation. The hash algorithm and canonicalization are documented.

**Residual risk:** Low, provided the verifier recomputes. If the verifier trusts the application's response without recomputing, the risk is the same as trusting any centralized service.

### Media substitution

**Attack:** An adversary replaces the media file in storage with a different file.

**Impact:** The SHA-256 hash of the substituted file would not match the hash anchored on-chain. A verifier who recomputes would detect the substitution.

**Mitigation:** `RecordMedia.sha256` is stored at upload time. The client computes the hash before upload; the server can recompute on retrieval.

**Residual risk:** Low, provided recomputation is performed.

### Centralized verifier risk

**Attack:** The verification endpoint (`/v/{txHash}`) returns fabricated data.

**Impact:** A verifier who trusts the endpoint response without independently checking the blockchain would accept fabricated records.

**Mitigation (current):** The endpoint returns the `txHash`, chain ID, and enough metadata for the verifier to independently query the blockchain and recompute.

**Mitigation (planned):** RFC 9421 response signing would allow offline verification of endpoint responses. SCITT-style receipts would provide a portable, self-contained proof.

**Residual risk:** Medium. The "verify independently" path requires the verifier to have blockchain access and hash recomputation capability. Most real-world verifiers will trust the endpoint.

### Denial of service

**Attack:** An adversary floods the verification endpoint or the notary wallet with requests/transactions.

**Impact:** Endpoint unavailability. Potential nonce desync on the notary wallet.

**Mitigation:** Rate limiting (planned). The notary wallet has a nonce recovery mechanism.

**Residual risk:** Medium.

## Attacks out of scope

- **SHA-256 collision/preimage attacks.** SHA-256 is not considered broken. If it is broken in the future, the version byte in the calldata format allows migration to a different algorithm.
- **L2 consensus attacks.** Attacks on the Base L2 sequencer, bridge, or settlement layer are out of scope for Redtail. These should be reported to the Base/Optimism team.
- **Physical asset fraud.** Redtail verifies that a digital record has not been altered since anchoring. It does not verify that the physical asset matches the record. A photograph of a genuine painting anchored on-chain does not prove the painting in front of you is the same one.
- **Social engineering.** Attacks that trick the operator into anchoring incorrect records are out of scope for the technical threat model.

## Trust model summary

Redtail's trust model is: **trust the anchoring transaction on a public blockchain as the integrity root; verify everything else by recomputation.**

The weakest link is the single notary wallet. Everything else — media integrity, metadata integrity, event ordering — can be independently verified by any party with access to the original inputs and the blockchain.

The planned standards adoption (COSE_Sign1, HTTP Message Signatures, SCITT receipts) aims to reduce the trust surface by making the hash self-authenticating, the verification responses signed, and the receipts portable.
