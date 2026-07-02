# Redtail Open Verifier

**Early public preview — open-source verification toolkit for tamper-evident public records and evidence integrity.**

Redtail Open Verifier is an open-source toolkit for verifying the integrity, continuity, and consistency of public records and their proofs.

It helps a third party check whether a record, its metadata, its media hashes, or its recorded change history still match a previously published integrity proof.

The verifier does **not** verify truth, real-world authenticity, ownership, identity, custody, legal validity, or the occurrence of real-world events.

## Public-interest scope

This repository is being prepared for public-interest verification use cases: tamper-evident public records, evidence-supporting materials, independent archival verification, and reproducible integrity checks.

The project originated from earlier record-verification work, but the verification core is deliberately narrower and more general. It can be applied to any structured record where the goal is to verify integrity against a previously published proof.

The project currently has no validated civil-society users, adopters, deployments, or partnerships. Public-interest outreach and usability testing are planned future work.

## What this verifier does

Redtail Open Verifier can help verify:

- that record metadata matches a previously published integrity proof,
- that media hashes match expected values,
- that a recorded change history is internally consistent,
- that a record has not been silently altered since it was anchored,
- that verification can be reproduced using open code, documented formats, and test vectors.

## What this verifier does not do

Redtail Open Verifier does not verify:

- whether the contents of a record are true,
- whether a real-world event occurred,
- legal authenticity,
- ownership,
- identity,
- chain of custody in the legal or forensic sense,
- origin or history of the underlying real-world material,
- permanent availability of underlying files.

If all parties delete the underlying files, their contents can no longer be verified. The verifier can only check records and files that are still available to the verifier.

## Current prototype

This repository is an early public preview and implementation testbed. It is not a production security system.

The public repository currently contains the verification-relevant core:

- canonical hashing logic,
- anchoring-format encoder/decoder,
- dependency-free headless verifier,
- documented verification flow,
- architecture documentation,
- threat model,
- protocol and canonicalization notes,
- valid and invalid test vectors,
- examples,
- unit tests.

The full production application, including authentication, billing, administration, and hosted service logic, is intentionally not part of this public mirror.

## Current anchoring mechanism

The current prototype uses Base L2 as one public anchoring mechanism for integrity proofs.

This is not the point of the project. It is the current prototype substrate.

The intended direction is a pluggable anchoring layer that can support other timestamping or transparency-log mechanisms, including non-blockchain backends such as RFC 3161 timestamping, OpenTimestamps-style proofs, or signed transparency-log receipts.

Only a compact integrity payload is anchored. Record contents, media, and personal data are not written to the public anchor.

## Verification model

At a high level:

1. A record contains structured metadata and media references.
2. Media files are represented by SHA-256 hashes.
3. Metadata is serialized deterministically.
4. A record digest is computed from canonical metadata and media hashes.
5. The digest is anchored or timestamped.
6. A verifier recomputes the digest and compares it with the published proof.

A match means the available record still matches the published proof. A mismatch indicates the record or its referenced files differ from the proof.

## Planned work

Planned work includes:

- standalone verifier package,
- local/offline command-line verifier,
- portable verification receipts,
- self-hostable public verification interface,
- pluggable anchoring layer,
- at least one non-blockchain timestamping or transparency-log backend,
- expanded test vectors,
- plain-language documentation for public-interest users,
- external security and privacy review,
- usability testing with public-interest workflows.

## Repository status

Status: early public preview  
Version: 0.1.0-preview  
License: Apache-2.0  
Maintainer: Hubert Szymański

## Documentation

- [Architecture](docs/architecture.md)
- [Threat model](docs/threat-model.md)
- [Verification flow](docs/verification-flow.md)
- [Protocol and canonicalization notes](docs/protocol-notes.md)
- [Data model](docs/data-model.md)
- [Status and scope](docs/status-and-scope.md)
- [Public-interest use cases](docs/public-interest-use-cases.md)
- [OTF scope note](docs/otf-scope.md)
- [Standards map](docs/standards-map.md)

## License

Apache-2.0. See [LICENSE](LICENSE).
