#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""
Redtail public release validation script.

Independently checks a prepared public release candidate for:
- Required files present.
- Forbidden files absent.
- No secret patterns in file contents.
- No billing/invoicing models in the Prisma schema.
- README.md contains required status markers.
- SECURITY.md contains a contact address.

Usage:
    python3 scripts/validate-public-release.py --dst /path/to/public-candidate

Exit code 0 = all checks pass. Non-zero = at least one check failed.
"""

import argparse
import os
import re
import sys
from pathlib import Path

# ─── Required files ───────────────────────────────────────────────────────────

REQUIRED_FILES = [
    "LICENSE",
    "README.md",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "ROADMAP.md",
    "docs/architecture.md",
    "docs/threat-model.md",
    "docs/standards-map.md",
    "docs/verification-flow.md",
    "docs/protocol-notes.md",
    "docs/interoperability.md",
    "docs/status-and-scope.md",
    "docs/sovereign-tech-standards-fit.md",
    "test-vectors/README.md",
    "examples/README.md",
]

# ─── Forbidden filename patterns ─────────────────────────────────────────────

FORBIDDEN_PATTERNS = [
    re.compile(r"\.env($|\.)"),
    re.compile(r".*\.bak\d*$"),
    re.compile(r".*\.dump$"),
    re.compile(r".*\.sql$"),
    re.compile(r".*\.pem$"),
    re.compile(r".*\.key$"),
    re.compile(r"^id_rsa"),
    re.compile(r"^id_ed25519"),
    re.compile(r".*\.tar(\.gz)?$"),
    re.compile(r".*\.zip$"),
    re.compile(r".*\.7z$"),
    re.compile(r"^cookies\.txt$"),
    re.compile(r"^user_session\.txt$"),
    re.compile(r"^vercel_token$"),
    re.compile(r"^bypass$"),
]

# ─── Secret content patterns ─────────────────────────────────────────────────

SECRET_PATTERNS = [
    ("stripe_key", re.compile(r"[sr]k_(live|test)_[A-Za-z0-9]{20,}")),
    ("stripe_webhook", re.compile(r"whsec_[A-Za-z0-9]{20,}")),
    ("private_key_pem", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("aws_key", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("github_pat", re.compile(r"(ghp_|github_pat_)[A-Za-z0-9_]{20,}")),
    ("postgres_with_pass", re.compile(r"postgres(ql)?://[^\"'\s]+:[^@\"'\s]+@")),
    ("alchemy_key", re.compile(r"g\.alchemy\.com/v2/[A-Za-z0-9_-]{20,}")),
    ("infura_key", re.compile(r"infura\.io/v3/[a-f0-9]{32}")),
]

# ─── Billing model names that should NOT appear in the public schema ──────────

FORBIDDEN_SCHEMA_MODELS = [
    "Stripe",
    "Invoice",
    "Billing",
    "KSeF",
    "VATEvidence",
    "VIESValidation",
    "OSSPeriodSummary",
    "SellerProfile",
    "BillingProfile",
    "RecordCharge",
    "BillingBatch",
    "Payment",
    "GuestPaymentIntent",
    "Order",
    "OrderItem",
    "WebhookEventLog",
]


def check_required_files(dst: Path) -> list[str]:
    """Check that all required files exist."""
    errors = []
    for relpath in REQUIRED_FILES:
        if not (dst / relpath).is_file():
            errors.append(f"MISSING: {relpath}")
    return errors


def check_forbidden_files(dst: Path) -> list[str]:
    """Walk the tree and check for forbidden filenames."""
    errors = []
    for root, dirs, files in os.walk(dst):
        # Skip .git if it exists.
        dirs[:] = [d for d in dirs if d != ".git"]
        for fname in files:
            for pattern in FORBIDDEN_PATTERNS:
                if pattern.match(fname):
                    relpath = os.path.relpath(os.path.join(root, fname), dst)
                    errors.append(f"FORBIDDEN FILE: {relpath} (matched {pattern.pattern})")
                    break
    return errors


def check_secret_content(dst: Path) -> list[str]:
    """Scan all text files for secret patterns."""
    errors = []
    for root, dirs, files in os.walk(dst):
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules")]
        for fname in files:
            fpath = Path(root) / fname
            try:
                content = fpath.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue

            relpath = str(fpath.relative_to(dst))
            for name, pattern in SECRET_PATTERNS:
                matches = pattern.findall(content)
                if matches:
                    errors.append(
                        f"SECRET DETECTED: {relpath} — rule `{name}` ({len(matches)} match(es))"
                    )
    return errors


def check_readme(dst: Path) -> list[str]:
    """Check README.md for required content markers."""
    errors = []
    readme = dst / "README.md"
    if not readme.is_file():
        return ["README.md not found"]

    content = readme.read_text(encoding="utf-8")
    lower = content.lower()

    if "early public preview" not in lower and "early-stage" not in lower:
        errors.append("README.md: missing 'early public preview' status marker")

    if "apache-2.0" not in lower and "apache license" not in lower:
        errors.append("README.md: missing Apache-2.0 license reference")

    if "security.md" not in lower:
        errors.append("README.md: missing link to SECURITY.md")

    if "standards-map.md" not in lower:
        errors.append("README.md: missing link to docs/standards-map.md")

    return errors


def check_license(dst: Path) -> list[str]:
    """Check LICENSE file is not a placeholder."""
    errors = []
    license_file = dst / "LICENSE"
    if not license_file.is_file():
        return ["LICENSE file not found"]

    content = license_file.read_text(encoding="utf-8")
    if "Apache License" not in content:
        errors.append("LICENSE: does not contain 'Apache License' header")
    if len(content) < 1000:
        errors.append("LICENSE: suspiciously short — may be a placeholder")

    return errors


def check_security(dst: Path) -> list[str]:
    """Check SECURITY.md has a contact."""
    errors = []
    sec = dst / "SECURITY.md"
    if not sec.is_file():
        return ["SECURITY.md not found"]

    content = sec.read_text(encoding="utf-8")
    if "@" not in content:
        errors.append("SECURITY.md: no email address found (security contact missing)")

    return errors


def check_schema(dst: Path) -> list[str]:
    """Check prisma/schema.prisma does not contain billing models."""
    errors = []
    schema = dst / "prisma" / "schema.prisma"
    if not schema.is_file():
        return []  # Schema is optional in the mirror.

    content = schema.read_text(encoding="utf-8")
    for model_name in FORBIDDEN_SCHEMA_MODELS:
        # Match model declarations like "model Invoice {"
        if re.search(rf"\bmodel\s+{model_name}\b", content):
            errors.append(f"SCHEMA: contains forbidden model `{model_name}`")
        # Also match any reference.
        if model_name in content and model_name not in ("Order",):
            # "Order" can appear in comments — only flag model declarations.
            pass

    return errors


def check_hex64(dst: Path) -> list[str]:
    """Check for 0x + 64 hex chars outside test vectors (possible private keys)."""
    errors = []
    pattern = re.compile(r"(?<![a-fA-F0-9])0x[a-fA-F0-9]{64}(?![a-fA-F0-9])")
    allowlist = {"test-vectors", "docs/on-chain-format.md", "calldata.test.ts"}

    for root, dirs, files in os.walk(dst):
        dirs[:] = [d for d in dirs if d not in (".git", "node_modules")]
        for fname in files:
            fpath = Path(root) / fname
            relpath = str(fpath.relative_to(dst))

            if any(a in relpath for a in allowlist):
                continue

            try:
                content = fpath.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue

            matches = pattern.findall(content)
            if matches:
                errors.append(
                    f"HEX64: {relpath} contains {len(matches)} 64-char hex value(s) — review for private keys"
                )

    return errors


def main():
    parser = argparse.ArgumentParser(
        description="Validate a Redtail public release candidate."
    )
    parser.add_argument("--dst", required=True, help="Path to the public release candidate.")
    args = parser.parse_args()

    dst = Path(args.dst).resolve()

    if not dst.is_dir():
        print(f"Error: directory does not exist: {dst}", file=sys.stderr)
        sys.exit(1)

    print(f"Validating: {dst}")
    print()

    all_errors = []

    checks = [
        ("Required files", check_required_files),
        ("Forbidden files", check_forbidden_files),
        ("Secret content scan", check_secret_content),
        ("README.md markers", check_readme),
        ("LICENSE file", check_license),
        ("SECURITY.md contact", check_security),
        ("Schema models", check_schema),
        ("Hex64 private key check", check_hex64),
    ]

    for name, check_fn in checks:
        errors = check_fn(dst)
        if errors:
            print(f"FAIL  {name}:")
            for e in errors:
                print(f"      {e}")
            all_errors.extend(errors)
        else:
            print(f"  OK  {name}")

    print()

    if all_errors:
        print(f"VALIDATION FAILED: {len(all_errors)} issue(s) found.")
        sys.exit(1)
    else:
        print("VALIDATION PASSED: all checks OK.")
        sys.exit(0)


if __name__ == "__main__":
    main()
