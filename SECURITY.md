# Security Policy

## Project status

Redtail is an **early public preview**.
It is a standards-focused implementation testbed, not production security infrastructure.
The verification model relies on a single notary wallet controlled by the operator; see [Threat Model](docs/threat-model.md) for the trust assumptions and residual risks.

Do not use Redtail as your sole security control for high-value assets without independent review.

## Supported versions

| Version | Status |
|---------|--------|
| 0.1.x-preview | Current early preview. Security reports accepted. |

Only the latest tagged release on the `main` branch receives attention.
There are no backport commitments at this stage.

## Reporting a vulnerability

If you discover a security issue, please report it responsibly.

**Email:** `contact@redtail.id`

When reporting, include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce, if possible.
- The version or commit hash you tested against.
- Whether you would like to be credited in an advisory.

**Response timeline:**

- Acknowledgment within 72 hours.
- Initial assessment within 7 days.
- Coordinated disclosure once a fix is available or within 90 days, whichever comes first.

Please do **not** open a public GitHub issue for security vulnerabilities.
Use the email address above or, if available, GitHub Security Advisories on this repository.

## Scope

In scope for security reports:

- Integrity hash computation (collision, preimage, or second-preimage weaknesses in the implementation, not in SHA-256 itself).
- Calldata format parsing (malformed input handling, buffer overflows in decoders).
- Verification endpoint logic (bypasses, false positives, false negatives).
- Key material handling in the public codebase (hardcoded secrets, insecure defaults).
- Dependency vulnerabilities that affect the verification path.

Out of scope for this public mirror:

- Vulnerabilities in the production application (billing, authentication, admin surfaces) — these are not present in this repository.
- Blockchain consensus or L2 sequencer vulnerabilities (report to Base/Optimism).
- Social engineering attacks on the operator.

## Known limitations

These are documented limitations, not vulnerabilities:

1. **Single notary wallet.** All anchoring transactions originate from one wallet. Compromise of the notary private key would allow an attacker to anchor fraudulent hashes. See [Threat Model](docs/threat-model.md#key-compromise).
2. **No signed statements.** The current model anchors unsigned hashes. There is no COSE_Sign1 or JWS envelope. An attacker who controls the notary wallet can anchor arbitrary data indistinguishably from legitimate records.
3. **No key rotation mechanism.** If the notary key is compromised, there is no automated revocation or rotation. This is a known gap documented in the [Roadmap](ROADMAP.md).
4. **No receipt signature.** The verification endpoint returns data over HTTPS (TLS provides transport security) but does not sign the response payload with RFC 9421 or equivalent. A party relying on cached or proxied responses cannot verify their origin.
