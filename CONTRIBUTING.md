# Contributing to Redtail

Redtail is an early-stage project maintained by a single developer.
Contributions — especially those related to standards feedback, interoperability testing, and threat model review — are welcome.

## Most valuable contributions right now

1. **Implementer feedback.** If you are implementing SCITT, COSE, HTTP Message Signatures, W3C VCs, or related standards and encounter questions or gaps that Redtail's model illuminates, please open a Standards Feedback issue.
2. **Interoperability reports.** If you have tested Redtail's verification format, calldata encoding, or hash computation against another implementation, please open an Interoperability Report issue.
3. **Test vectors.** Contributions to `test-vectors/` — especially edge cases, invalid inputs, and cross-implementation comparison data — are highly valued.
4. **Threat model review.** If you identify an attack, residual risk, or trust assumption missing from `docs/threat-model.md`, please open an issue or PR.

## Code contributions

- Fork the repository and create a feature branch from `main`.
- Keep changes focused: one logical change per PR.
- Include or update tests for any code changes in `src/`.
- Describe what the change does and why in the PR description.

## Documentation contributions

- Corrections, clarifications, and improvements to any file in `docs/` are welcome.
- Use precise, technical language. Avoid marketing tone.
- If you add a new document, update the relevant links in `README.md`.

## Issue guidelines

- Check existing issues before opening a new one.
- Use the provided issue templates where applicable.
- For security vulnerabilities, do **not** open a public issue. See [SECURITY.md](SECURITY.md).

## Pull request process

1. Open a PR against `main`.
2. Describe the change, its motivation, and any standards context.
3. The maintainer will review within a reasonable timeframe. This is a single-maintainer project; please be patient.
4. PRs that touch the verification path, hash computation, or calldata format will receive closer scrutiny.

## Code style

- TypeScript: strict mode, explicit types on public APIs.
- Markdown: one sentence per line (for clean diffs). No trailing whitespace.
- A formal linter/formatter configuration will be added in a future release.

## Security contribution boundaries

- Do **not** include secrets, keys, or credentials in any contribution.
- Do **not** introduce dependencies with non-permissive licenses (GPL, AGPL, SSPL) without prior discussion.
- Do **not** submit code that interacts with production infrastructure, real wallets, or live blockchain endpoints in tests.

## Governance

This project is currently maintained by a single developer.
There is no formal governance structure.
Contributions are reviewed and merged at the maintainer's discretion.
If the project grows to the point where shared governance is appropriate, that structure will be established transparently.

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 license that covers this project.
