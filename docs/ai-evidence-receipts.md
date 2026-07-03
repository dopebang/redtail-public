# AI evidence integrity receipts

Redtail Open Verifier can be applied to AI-related records where the goal is to verify integrity, continuity, and consistency against a previously published proof.

This document describes a proposed grant-funded scope for AI evidence integrity receipts. It is not a claim that these AI workflows are already implemented or adopted.

## Purpose

AI systems increasingly generate, summarize, evaluate, classify, and support records that may later be reviewed, disputed, audited, or cited.

The surrounding record trail is often fragile:

- outputs can be edited,
- prompts can be lost,
- model references can become unclear,
- dataset references can drift,
- metadata can change,
- evaluation artifacts can be disputed,
- supporting files can be replaced.

Redtail Open Verifier addresses one narrow part of this problem: integrity verification.

It helps a third party check whether an AI-related record still matches a previously published integrity proof.

It does not verify truth, correctness, model quality, authorship, identity, legal validity, ownership, or whether a real-world event occurred.

## Intended AI record types

Potential AI-related records include:

- model output records,
- prompt hashes,
- metadata bundles,
- model version references,
- dataset or source references,
- evaluation results,
- benchmark artifacts,
- AI-assisted research notes,
- public-claim support files,
- audit-trail entries.

These are intended use cases, not current deployments.

## What an AI evidence receipt may contain

A portable receipt could include:

- record identifier,
- record digest,
- timestamp or anchoring reference,
- hash of the AI output,
- hash of the prompt or prompt bundle,
- model reference or model identifier,
- dataset or source reference hashes,
- evaluation artifact hashes,
- canonicalization version,
- verifier version,
- optional notes about what is and is not being verified.

The exact receipt format is future work.

## Verification model

At a high level:

1. A record is created with AI-related metadata and supporting files.
2. The relevant fields and files are canonicalized or hashed.
3. A compact integrity proof is created.
4. The proof is timestamped or anchored.
5. A third party later verifies the record against the receipt.
6. A match means the available record still matches the published proof.
7. A mismatch indicates that the record or referenced files differ from the proof.

This is an integrity check, not a truth check.

## What this would help with

AI evidence receipts could help:

- preserve reviewable records of AI-assisted work,
- make model-output records easier to audit,
- reduce disputes about whether a record changed after publication,
- allow independent checking without depending on a hosted platform,
- support local or offline verification,
- make AI workflow artifacts more portable across tools.

## What this does not solve

Redtail Open Verifier does not:

- prove that an AI output is correct,
- prove that a model generated a specific output,
- prove that a prompt caused a specific output,
- verify model quality or safety,
- detect deepfakes,
- verify human identity,
- verify legal authenticity,
- prevent edits from happening,
- preserve deleted files forever.

It only helps detect whether available records differ from previously published integrity proofs.

## Proposed grant-funded work

A Sentient Foundation grant would support:

- an AI evidence receipt format,
- local/offline verifier support for AI-related receipts,
- a self-hostable public verification page,
- examples and test vectors for AI workflows,
- documentation explaining what is and is not verified,
- a lightweight security and privacy review,
- clearer guidance for developers who want to integrate receipts into open AI workflows.

## Current status

The repository currently contains an early open-source verification prototype:

- canonical hashing logic,
- anchoring-format encoder/decoder,
- dependency-free headless verifier,
- documented verification flow,
- architecture documentation,
- threat model,
- examples,
- valid and invalid test vectors,
- unit tests.

The AI evidence receipt format is not yet implemented. It is proposed future work.

The project currently has no validated AI workflow users, adopters, deployments, or partnerships.
