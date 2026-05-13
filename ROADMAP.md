# Roadmap

This roadmap is organized into four tracks.
Items are not commitments; they are the current plan, subject to change based on standards engagement and implementer feedback.

## Track 1 — Implementation

Work on the core system: data model, verification flow, and deployment.

- [x] SHA-256 media + metadata integrity hashing
- [x] On-chain anchoring on Base L2 with RDTL calldata format (v1)
- [x] Append-only event log (`RecordEvent`) with per-event anchoring
- [x] Content-addressable media (`RecordMedia` with SHA-256)
- [x] Public verification endpoint (`/v/{txHash}`)
- [x] Category-driven structured fields (EAV pattern)
- [ ] Standalone headless verifier (TypeScript, no framework dependencies)
- [ ] CLI tool for offline hash verification
- [ ] Calldata format v2 (support for additional hash algorithms, COSE envelope)
- [ ] Multi-notary support (multiple anchoring wallets)
- [ ] Key rotation mechanism with on-chain announcement

## Track 2 — Standards

Adoption of specific IETF and W3C standards, and production of implementer feedback.

- [ ] **COSE_Sign1 wrapping** — wrap the SHA-256 hash in a COSE_Sign1 envelope (RFC 9052) before anchoring. Produce an implementer report on adoption cost and format choices.
- [ ] **HTTP Message Signatures** — sign verification endpoint responses per RFC 9421. Produce test vectors and an interoperability note.
- [ ] **SCITT alignment** — evaluate the cost of aligning the anchoring and receipt model with RFC 9711 (SCITT architecture). Produce a gap analysis document.
- [ ] **Structured verification receipt** — replace the ad-hoc receipt with a receipt format aligned to SCITT or COSE receipts. Publish the receipt schema as a test vector.
- [ ] **W3C VC modeling** — express a Redtail record + event chain as a W3C Verifiable Credential. Publish a conformance example.
- [ ] **DID binding** — express the notary wallet as `did:pkh:eip155:8453:0x…` and document the key discovery path.
- [ ] **C2PA comparison document** — publish a structured comparison of Redtail's record-centric model with C2PA's asset-bytes-centric model.

## Track 3 — Security hardening

Work specifically aimed at reducing residual risk.

- [ ] Formal threat model review (external, if funded)
- [ ] Multi-factor authentication on operator accounts (production system)
- [ ] Key rotation and revocation mechanism
- [ ] Automated secret scanning in CI (gitleaks)
- [ ] Dependency audit automation (Dependabot, npm audit)
- [ ] Rate limiting and abuse prevention on verification endpoint
- [ ] Integrity verification of the verification endpoint itself (signed responses)

## Track 4 — Community and ecosystem

- [ ] Publish initial public mirror (this repository) — v0.1.0-preview
- [ ] Populate `test-vectors/v1/` with at least 5 valid and 5 invalid cases
- [ ] Publish at least one interoperability note against an independent implementation
- [ ] Write and submit at least one implementer feedback document to an IETF or W3C mailing list
- [ ] Establish a contribution guide for standards-related contributions
- [ ] If the project reaches multiple external contributors, establish lightweight governance
