#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""
Redtail public release preparation script.

Copies an explicit allowlist of files from a private source repository
into a clean destination directory. Scans every copied file for likely
secrets and skips any file that triggers a detection. Generates a
PUBLIC_RELEASE_REPORT.md in the destination.

Usage:
    python3 scripts/prepare-public-release.py --src /path/to/private --dst /path/to/public
    python3 scripts/prepare-public-release.py --src /path/to/private --dst /path/to/public --dry-run
"""

import argparse
import hashlib
import math
import os
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# ─── Allowlist ────────────────────────────────────────────────────────────────
# Only these paths (relative to --src) will be considered for copying.
# Everything else is silently skipped.
# Glob patterns are NOT supported — list each file or directory explicitly.

ALLOW_DIRS = [
    "src/lib/v2",
    "src/lib/blockchain",
]

ALLOW_FILES = [
    "prisma/schema.prisma",
    "package.json",
    "tsconfig.json",
    "CLAUDE.md",
    ".gitignore",
]

# ─── Deny patterns (filename) ────────────────────────────────────────────────
# Files matching any of these patterns are NEVER copied regardless of allowlist.

DENY_FILENAME_PATTERNS = [
    re.compile(r"\.env($|\.)"),
    re.compile(r"\.env\..*"),
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
    re.compile(r".*secret.*", re.IGNORECASE),
    re.compile(r".*credential.*", re.IGNORECASE),
    re.compile(r".*wallet.*\.json$", re.IGNORECASE),
]

# ─── Deny directories ────────────────────────────────────────────────────────

DENY_DIRS = {
    ".git",
    "node_modules",
    ".next",
    "dist",
    "build",
    ".vercel",
    "coverage",
    ".turbo",
    "out",
    "__pycache__",
    ".pytest_cache",
    ".venv",
    "venv",
    "backups",
    "delivery",
    "staging",
}

# ─── Content secret patterns ─────────────────────────────────────────────────
# Each is (name, compiled_regex). If a file's content matches, it is skipped.

SECRET_PATTERNS = [
    ("stripe_secret_key", re.compile(r"sk_(live|test)_[A-Za-z0-9]{20,}")),
    ("stripe_publishable_key", re.compile(r"pk_(live|test)_[A-Za-z0-9]{20,}")),
    ("stripe_webhook_secret", re.compile(r"whsec_[A-Za-z0-9]{20,}")),
    ("stripe_restricted_key", re.compile(r"rk_(live|test)_[A-Za-z0-9]{20,}")),
    ("jwt_token", re.compile(r"eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.")),
    ("private_key_pem", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("openssh_private_key", re.compile(r"BEGIN OPENSSH PRIVATE KEY")),
    ("aws_access_key", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("github_pat", re.compile(r"(ghp_|github_pat_)[A-Za-z0-9_]{20,}")),
    ("slack_token", re.compile(r"xox[bprs]-[A-Za-z0-9\-]{20,}")),
    ("postgres_url_with_password", re.compile(r"postgres(ql)?://[^\"'\s]+:[^@\"'\s]+@")),
    ("mongodb_url_with_password", re.compile(r"mongodb(\+srv)?://[^\"'\s]+:[^@\"'\s]+@")),
    ("redis_url_with_password", re.compile(r"redis://[^\"'\s]+:[^@\"'\s]+@")),
    ("alchemy_api_key", re.compile(r"https://[a-z0-9-]+\.g\.alchemy\.com/v2/[A-Za-z0-9_-]{20,}")),
    ("infura_key", re.compile(r"infura\.io/v3/[a-f0-9]{32}")),
    ("hex_64_possible_privkey", re.compile(r"(?<![a-fA-F0-9])0x[a-fA-F0-9]{64}(?![a-fA-F0-9])")),
    ("supabase_service_key", re.compile(r"eyJ[A-Za-z0-9_-]{100,}")),  # very long JWTs
    ("npm_token", re.compile(r"npm_[A-Za-z0-9]{20,}")),
    ("polish_nip", re.compile(r"\bNIP[:\s]*\d{10}\b")),
    ("polish_pesel", re.compile(r"\bPESEL[:\s]*\d{11}\b")),
    ("iban", re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b")),
]

# Files where hex_64 patterns are expected and should not trigger denial.
HEX64_ALLOWLIST_PATHS = {
    "test-vectors",
    "src/format/calldata.test.ts",
    "docs/on-chain-format.md",
}


def shannon_entropy(data: str) -> float:
    """Calculate Shannon entropy of a string."""
    if not data:
        return 0.0
    freq = {}
    for ch in data:
        freq[ch] = freq.get(ch, 0) + 1
    length = len(data)
    return -sum((c / length) * math.log2(c / length) for c in freq.values())


def is_high_entropy_token(token: str) -> bool:
    """Check if a token looks like a secret (high entropy, long, base64/hex-shaped)."""
    if len(token) < 24:
        return False
    if not re.match(r"^[A-Za-z0-9+/=_-]+$", token):
        return False
    return shannon_entropy(token) > 4.5


def scan_content(content: str, relpath: str) -> list[tuple[str, int]]:
    """Scan file content for secret patterns. Returns list of (rule_name, line_number)."""
    hits = []
    lines = content.split("\n")

    for line_num, line in enumerate(lines, start=1):
        for name, pattern in SECRET_PATTERNS:
            # Skip hex_64 check for allowlisted paths.
            if name == "hex_64_possible_privkey":
                if any(allow in relpath for allow in HEX64_ALLOWLIST_PATHS):
                    continue
            if pattern.search(line):
                hits.append((name, line_num))

        # High-entropy token scan.
        tokens = re.findall(r"[A-Za-z0-9+/=_-]{24,}", line)
        for token in tokens:
            if is_high_entropy_token(token):
                # Don't double-count if already caught by a named pattern.
                already = any(h[1] == line_num for h in hits)
                if not already:
                    hits.append(("high_entropy_token", line_num))
                    break  # One hit per line is enough.

    return hits


def is_denied_filename(filename: str) -> Optional[str]:
    """Check if filename matches deny patterns. Returns pattern string or None."""
    for pattern in DENY_FILENAME_PATTERNS:
        if pattern.match(filename):
            return pattern.pattern
    return None


def should_skip_dir(dirname: str) -> bool:
    """Check if a directory name is in the deny set."""
    return dirname in DENY_DIRS


def is_binary(filepath: Path) -> bool:
    """Quick check if a file is binary."""
    try:
        with open(filepath, "rb") as f:
            chunk = f.read(8192)
            return b"\x00" in chunk
    except OSError:
        return True


def prepare_release(src: Path, dst: Path, dry_run: bool = False) -> str:
    """
    Main release preparation logic.
    Returns the report content as a string.
    """
    report_lines = [
        "# Public Release Report",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        f"Source: `{src}`",
        f"Destination: `{dst}`",
        f"Dry run: {dry_run}",
        "",
        "## Summary",
        "",
    ]

    copied = []
    skipped_deny_filename = []
    skipped_deny_dir = []
    skipped_secret_scan = []
    skipped_binary = []
    missing = []

    def process_path(rel: str):
        """Process a single allowlisted path."""
        full = src / rel

        if not full.exists():
            missing.append(rel)
            return

        if full.is_file():
            process_file(rel, full)
        elif full.is_dir():
            for root, dirs, files in os.walk(full):
                # Filter out denied directories.
                dirs[:] = [d for d in dirs if not should_skip_dir(d)]

                for fname in files:
                    fpath = Path(root) / fname
                    frel = str(fpath.relative_to(src))
                    process_file(frel, fpath)

    def process_file(rel: str, full: Path):
        """Process a single file."""
        fname = full.name

        # Filename deny check.
        deny = is_denied_filename(fname)
        if deny:
            skipped_deny_filename.append((rel, deny))
            return

        # Binary check — skip binaries from source (we only want text/code).
        if is_binary(full):
            skipped_binary.append(rel)
            return

        # Content secret scan.
        try:
            content = full.read_text(encoding="utf-8", errors="replace")
        except OSError as e:
            skipped_binary.append(f"{rel} (read error: {e})")
            return

        hits = scan_content(content, rel)
        if hits:
            skipped_secret_scan.append((rel, hits))
            return

        # All clear — copy.
        dst_path = dst / rel
        if not dry_run:
            dst_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(full, dst_path)
        copied.append(rel)

    # Process allowlisted files.
    for f in ALLOW_FILES:
        process_path(f)

    # Process allowlisted directories.
    for d in ALLOW_DIRS:
        process_path(d)

    # ─── Build report ─────────────────────────────────────────────────────

    report_lines.append(f"- Files copied: {len(copied)}")
    report_lines.append(f"- Skipped (denied filename): {len(skipped_deny_filename)}")
    report_lines.append(f"- Skipped (denied directory): {len(skipped_deny_dir)}")
    report_lines.append(f"- Skipped (secret scan hit): {len(skipped_secret_scan)}")
    report_lines.append(f"- Skipped (binary): {len(skipped_binary)}")
    report_lines.append(f"- Missing from source: {len(missing)}")
    report_lines.append("")

    if copied:
        report_lines.append("## Copied files")
        report_lines.append("")
        for f in sorted(copied):
            report_lines.append(f"- `{f}`")
        report_lines.append("")

    if skipped_deny_filename:
        report_lines.append("## Skipped — denied filename")
        report_lines.append("")
        for f, pat in sorted(skipped_deny_filename):
            report_lines.append(f"- `{f}` — matched pattern `{pat}`")
        report_lines.append("")

    if skipped_secret_scan:
        report_lines.append("## Skipped — secret scan hit")
        report_lines.append("")
        report_lines.append("**Review these manually.** The matched value is NOT shown.")
        report_lines.append("")
        for f, hits in sorted(skipped_secret_scan, key=lambda x: x[0]):
            report_lines.append(f"- `{f}`")
            for rule_name, line_num in hits:
                report_lines.append(f"  - Rule `{rule_name}` on line {line_num}")
        report_lines.append("")

    if skipped_binary:
        report_lines.append("## Skipped — binary files")
        report_lines.append("")
        for f in sorted(skipped_binary):
            report_lines.append(f"- `{f}`")
        report_lines.append("")

    if missing:
        report_lines.append("## Missing from source")
        report_lines.append("")
        for f in sorted(missing):
            report_lines.append(f"- `{f}`")
        report_lines.append("")

    report_lines.append("## Manual review checklist")
    report_lines.append("")
    report_lines.append("- [ ] Read every file in the destination directory.")
    report_lines.append("- [ ] Run `gitleaks detect --no-git -v` against the destination.")
    report_lines.append("- [ ] Run `trufflehog filesystem --no-update --only-verified` against the destination.")
    report_lines.append("- [ ] Run `python3 scripts/validate-public-release.py --dst <destination>`.")
    report_lines.append("- [ ] Confirm no real names, customer data, or Polish-language operational notes.")
    report_lines.append("- [ ] Confirm `prisma/schema.prisma` contains no billing/invoicing models.")
    report_lines.append("- [ ] Confirm all dependencies in `package.json` are permissive-licensed.")
    report_lines.append("")

    return "\n".join(report_lines)


def main():
    parser = argparse.ArgumentParser(
        description="Prepare a clean Redtail public release candidate."
    )
    parser.add_argument("--src", required=True, help="Path to the private source repository.")
    parser.add_argument("--dst", required=True, help="Path to the public release destination.")
    parser.add_argument("--dry-run", action="store_true", help="Report only, do not copy files.")
    args = parser.parse_args()

    src = Path(args.src).resolve()
    dst = Path(args.dst).resolve()

    if not src.is_dir():
        print(f"Error: source directory does not exist: {src}", file=sys.stderr)
        sys.exit(1)

    if dst.exists() and any(dst.iterdir()):
        print(f"Error: destination directory is not empty: {dst}", file=sys.stderr)
        print("Please use an empty or non-existent directory.", file=sys.stderr)
        sys.exit(1)

    if not args.dry_run:
        dst.mkdir(parents=True, exist_ok=True)

    print(f"Source:      {src}")
    print(f"Destination: {dst}")
    print(f"Dry run:     {args.dry_run}")
    print()

    report = prepare_release(src, dst, dry_run=args.dry_run)

    if not args.dry_run:
        report_path = dst / "PUBLIC_RELEASE_REPORT.md"
        report_path.write_text(report, encoding="utf-8")
        print(f"Report written to: {report_path}")
    else:
        print("─── DRY RUN REPORT ───")
        print(report)


if __name__ == "__main__":
    main()
