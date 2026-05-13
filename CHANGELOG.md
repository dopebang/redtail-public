# Changelog

All notable changes to the Redtail public mirror will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0-preview] — UNRELEASED

### Added

- Initial public mirror of the verification-relevant core.
- Core documentation: architecture, threat model, standards map, verification flow, protocol notes, interoperability, status and scope, glossary.
- Sovereign Tech Standards positioning document.
- Slimmed Prisma schema covering records, events, media, categories, and fields.
- Standalone calldata encoder/decoder (`src/format/`).
- SHA-256 hashing utilities (`src/hash/`).
- Headless verifier module (`src/verify/`).
- Test vector directory structure with initial examples.
- GitHub issue templates for bug reports, standards feedback, and interoperability reports.
- Minimal CI workflow (typecheck, test, secret scan).
- Apache-2.0 license.
