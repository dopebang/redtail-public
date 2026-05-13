# Sovereign Tech Standards Fit

This document explains how Redtail fits the Sovereign Tech Standards programme and what standards work it can support.

## What Sovereign Tech Standards funds

Sovereign Tech Standards supports open-source maintainers who want to participate in standardization work at IETF, W3C, or ISO and bring practical implementation experience into those processes.
It funds the maintainer's time and participation, not product development.

## Why Redtail fits

### 1. It is a real, deployed system

Redtail is not a research prototype.
It is a commercial B2B platform with paying customers, running in production on Base L2.
Its implementation choices are constrained by real operational pressures: cost, reliability, EU regulatory requirements, single-operator resource limits.

This means its feedback on standards adoption is calibrated by reality, not by the freedom of a research environment.

### 2. It represents an underrepresented perspective

Standards bodies are disproportionately populated by large organizations with dedicated standards teams.
Small, sole-operator infrastructure projects — the ones that will actually be asked to adopt the resulting standards — are structurally underrepresented.

Redtail is a single-developer, single-operator system based in Poland.
Its perspective on standards adoption cost, complexity, and practical barriers is exactly the kind of feedback that makes standards more implementable.

### 3. It has not yet adopted the relevant standards

This is a feature, not a bug, for Sovereign Tech Standards purposes.
A system that has already adopted COSE, SCITT, and HTTP Message Signatures can report on how it went.
A system that has *not yet adopted them* can report on the practical cost, the decisions involved, the ambiguities encountered, and the gaps discovered *during adoption*.
That before/during/after narrative is the most useful form of implementer feedback.

### 4. It intersects concrete IETF work items

See [Standards Map](standards-map.md) for the full analysis. In summary:

- SCITT (RFC 9711): Redtail is a small transparency service that predates SCITT. Aligning with SCITT is a concrete adoption exercise.
- COSE (RFC 9052): Wrapping the existing hash in COSE_Sign1 is the smallest-scope standards adoption task.
- HTTP Message Signatures (RFC 9421): Signing the verification endpoint responses is a concrete, testable exercise.
- Verification receipts: Structuring the ad-hoc receipt against SCITT receipt drafts is a natural next step.

## What the repository demonstrates

This public mirror is the evidence base for the standards engagement.
It shows:

- A real data model for physical-asset records with append-only events and content-addressable media.
- A concrete on-chain anchoring format with a defined structure (magic + version + hash).
- A verification flow that any party can execute independently.
- A documented threat model with honest residual risks.
- A gap analysis against relevant IETF and W3C standards.

## What standards work Redtail can produce

### Concrete deliverables

1. **Implementer report: adopting COSE_Sign1.** Document the cost, format choices, dependency additions, and remaining questions involved in wrapping Redtail's SHA-256 hash in a COSE_Sign1 envelope. Address the secp256k1-in-COSE question specifically.

2. **Implementer report: adopting RFC 9421.** Document the implementation of HTTP Message Signatures on the verification endpoint. Produce test vectors (signed responses) and an interoperability note.

3. **SCITT gap analysis.** Analyze what a single-operator, blockchain-anchored system would need to do to align with RFC 9711. Identify where the architecture fits, where it diverges, and what questions this raises for the SCITT WG.

4. **Test vectors.** Publish a versioned test vector set covering: valid anchors, invalid anchors (tampered metadata, substituted media, malformed calldata), and COSE_Sign1 wrapped anchors.

5. **Interoperability note.** Test the calldata format and hash computation against at least one independent implementation. Document the results.

6. **Standards feedback.** Submit at least one comment or issue to an IETF working group mailing list or issue tracker based on implementation experience.

7. **Small-operator perspective document.** A short document on "What it costs a sole-operator EU-based system to adopt IETF verification standards" — suitable for citation in WG discussions.

### What this is not

- It is not a request to fund Redtail product development.
- It is not a claim that Redtail implements these standards today.
- It is not a proposal for a new standard. It is a proposal to bring implementer feedback into existing standards processes.

## Relationship to other funding

This positioning is specific to Sovereign Tech Standards.
It does not overlap with:

- **NLnet NGI / FLOSS/fund:** which fund feature development and infrastructure hardening.
- **Sovereign Tech Fund (the larger programme):** which funds maintenance of widely-used critical infrastructure.
- **HORIZON-CL2 consortium grants:** which fund collaborative research projects.

Redtail may apply to these programmes separately, for different scopes of work.
The Sovereign Tech Standards engagement is specifically about standards participation and implementer feedback.
