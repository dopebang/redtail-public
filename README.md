# Redtail

**Early public preview — standards-focused implementation testbed.**

**Project website:** https://redtail.id
**Public repository:** https://github.com/dopebang/redtail-public

Redtail is an open-source verification layer for physical assets.
It anchors integrity proofs for records (art, collectibles, luxury goods, cultural objects) on a public blockchain and exposes a verification surface that any party can check independently.

This repository is a curated public mirror of the verification-relevant core.
The broader Redtail project is represented by the official project website at https://redtail.id.

It is published as an implementation testbed for standards work — primarily IETF SCITT, COSE, and HTTP Message Signatures — and is not a production security system.

> **Status:** Early public preview.
> The anchoring format, data model, and verification flow are functional and deployed, but the project does not yet implement COSE_Sign1, RFC 9421 (HTTP Message Signatures), or the SCITT architecture (RFC 9711).
> It produces SHA-256 integrity proofs anchored as EVM calldata.
> See [Status and Scope](docs/status-and-scope.md) for details.

---

## Problem

When a physical asset changes hands, the parties involved have no shared, independently verifiable record of what that asset is, what happened to it, or who attested to those facts.
Existing solutions require trust in a single platform, are not interoperable, and produce records that cannot be verified without the issuing service.

Redtail addresses this by:

1. Computing a deterministic SHA-256 hash over media (photographs, documents) and structured metadata.
2. Anchoring that hash on a public L2 blockchain (Base) as immutable calldata.
3. Exposing a public verification endpoint where any party can recompute the hash and compare it against the on-chain anchor.
4. Maintaining an append-only event log per record, with optional per-event anchoring.

## Goals

- Provide a self-hostable, open-source verification layer for physical-asset provenance.
- Serve as an implementation testbed for IETF standards adoption (SCITT, COSE, HTTP Message Signatures, verification receipts).
- Produce implementer feedback, test vectors, and interoperability notes from a small-operator perspective.
- Demonstrate the practical cost of standards adoption for sole-operator infrastructure.

## Non-goals

- Redtail is **not** a decentralized identity system, a token/NFT platform, or a DAO.
- Redtail does **not** claim trustless verification in the cryptographic sense. The current anchoring model relies on a single notary wallet; see [Threat Model](docs/threat-model.md).
- Redtail does **not** implement W3C Verifiable Credentials, COSE_Sign1, or HTTP Message Signatures today. These are on the [Roadmap](ROADMAP.md) as standards-track adoption exercises.
- This repository is **not** the full production application. It is a curated mirror of the verification-relevant core.

## Built on Base

Redtail uses Base L2 as the public anchoring layer for record integrity proofs.

Each anchored record stores a versioned EVM calldata payload containing:

- the Redtail magic prefix `0x5244544C`;
- a one-byte format version;
- a 32-byte SHA-256 digest of canonical metadata and media bytes.

This makes Base the public verification substrate for Redtail records: a verifier can recompute the digest, inspect the Base transaction calldata, and compare the two without relying on a private Redtail database.

Redtail demonstrates a non-financial Base use case: durable verification records for physical-asset provenance, including art, collectibles, luxury goods, and cultural objects.

## Architecture overview

```
┌─────────────┐    SHA-256     ┌──────────────┐    calldata     ┌────────────┐
│ Media +     │───────────────▶│ Redtail      │────────────────▶│ Base L2    │
│ Metadata    │   (canonical)  │ Notary       │  0x5244544C +   │ Blockchain │
└─────────────┘                └──────────────┘  version + hash └────────────┘
                                                                       │
                                                                       ▼
                                                              ┌────────────────┐
                                                              │ Public         │
                                                              │ verification   │
                                                              │ endpoint       │
                                                              │ /v/{txHash}    │
                                                              └────────────────┘
```

The anchoring format is a self-send transaction on Base L2.
The calldata is structured as:

| Offset | Length | Content |
|--------|--------|---------|
| 0 | 4 bytes | Magic: `0x5244544C` ("RDTL" in ASCII) |
| 4 | 1 byte | Version: `0x01` |
| 5 | 32 bytes | SHA-256 hash of (canonical metadata + media bytes) |

See [Architecture](docs/architecture.md), [On-Chain Format](docs/on-chain-format.md), and [Verification Flow](docs/verification-flow.md) for details.

## Data model

The core data model (see [Data Model](docs/data-model.md) and `prisma/schema.prisma`) consists of:

- **Record** — a named asset with structured metadata, category, and status lifecycle.
- **RecordEvent** — an append-only event log entry (creation, transfer, inspection, certification, etc.) with optional on-chain anchor (`txHash`).
- **RecordMedia** — media files (photos, documents) with SHA-256 integrity hashes and purpose classification.
- **RecordFieldValue** — structured metadata fields defined by a category schema (EAV pattern).
- **CategoryDefinition / FieldDefinition** — schema definitions for record types and their fields.

## Standards relevance

Redtail intersects several active IETF and W3C work items.
See [Standards Map](docs/standards-map.md) for the full analysis.

**IETF (primary):**

- SCITT (RFC 9711) — Redtail is a small, single-operator transparency service that has not yet adopted the SCITT architecture, making it a useful source of implementer feedback on adoption cost.
- COSE (RFC 9052) — the current unsigned-hash model is a candidate for COSE_Sign1 wrapping.
- HTTP Message Signatures (RFC 9421) — the `/v/{txHash}` verification endpoint is a candidate for response signing.
- Verification receipts — the current receipt is ad-hoc; structuring it against SCITT receipt formats is planned.

**W3C (secondary):**

- Verifiable Credentials Data Model 2.0 — a record with its event chain can be modeled as a VC.
- Decentralized Identifiers — the notary wallet address can be expressed as `did:pkh:eip155:8453:0x…`.
- C2PA (ISO 22144) — Redtail is record-centric where C2PA is asset-bytes-centric; the intersection and gaps are documented.

## Repository structure

```
├── LICENSE                          Apache-2.0
├── README.md                        This file
├── SECURITY.md                      Security policy and reporting
├── CONTRIBUTING.md                  Contribution guidelines
├── ROADMAP.md                       Implementation, standards, and security roadmaps
├── docs/
│   ├── architecture.md              Architectural goals, components, trust boundaries
│   ├── data-model.md                Core data model reference
│   ├── on-chain-format.md           Calldata format specification
│   ├── verification-flow.md         End-to-end verification lifecycle
│   ├── protocol-notes.md            Data formats, canonicalization, versioning
│   ├── threat-model.md              Assets, actors, attacks, residual risks
│   ├── standards-map.md             IETF/W3C mapping and gap analysis
│   ├── interoperability.md          Cross-system interop considerations
│   ├── status-and-scope.md          What is ready, experimental, and out of scope
│   ├── sovereign-tech-standards-fit.md  Positioning for standards engagement
│   └── glossary.md                  Terminology
├── prisma/
│   └── schema.prisma                Core data model (verification-relevant subset)
├── src/
│   ├── format/                      Calldata encoder/decoder
│   ├── hash/                        SHA-256 and canonical hashing
│   └── verify/                      Headless verifier
├── test-vectors/                    Valid/invalid verification test cases
├── examples/                        Usage examples
└── .github/                         Issue templates, CI workflows
```

## Security

This project is an early public preview and is **not production security infrastructure**.
See [SECURITY.md](SECURITY.md) for the security policy, reporting process, and current limitations.

## License

Apache-2.0. See [LICENSE](LICENSE).

## Links

- [Project website](https://redtail.id)
- [Public repository](https://github.com/dopebang/redtail-public)
- [Architecture](docs/architecture.md)
- [Threat Model](docs/threat-model.md)
- [Standards Map](docs/standards-map.md)
- [Verification Flow](docs/verification-flow.md)
- [Protocol Notes](docs/protocol-notes.md)
- [Interoperability](docs/interoperability.md)
- [Status and Scope](docs/status-and-scope.md)
- [Standards Fit](docs/sovereign-tech-standards-fit.md)
- [Roadmap](ROADMAP.md)
- [Contributing](CONTRIBUTING.md)
