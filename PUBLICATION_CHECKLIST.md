# Publication Checklist

Step-by-step instructions for publishing the Redtail public mirror.
Do not skip steps. Do not automate the final push.

## Prerequisites

- [ ] Python 3.10+ installed.
- [ ] Node.js 20+ and npm installed.
- [ ] `gitleaks` installed (`brew install gitleaks` or `go install github.com/gitleaks/gitleaks/v8@latest`).
- [ ] `trufflehog` installed (`brew install trufflehog` or from [GitHub releases](https://github.com/trufflesecurity/trufflehog/releases)).
- [ ] A GitHub account with permission to create repositories.
- [ ] The `contact@redtail.id` email alias is configured and receiving mail (or update `SECURITY.md` with the correct address).

## Phase 1 — Prepare the release candidate

### Step 1: Run the preparation script (dry run first)

```bash
python3 scripts/prepare-public-release.py \
    --src /path/to/private/redtail \
    --dst /tmp/redtail-public-candidate \
    --dry-run
```

Read the dry-run output. Confirm nothing unexpected is being copied or skipped.

### Step 2: Run for real

```bash
python3 scripts/prepare-public-release.py \
    --src /path/to/private/redtail \
    --dst /tmp/redtail-public-candidate
```

### Step 3: Copy the public mirror files

The preparation script copies source files it can safely extract.
The documentation, TypeScript modules, test vectors, and configuration files from the public mirror template should be overlaid:

```bash
# From the directory containing the prepared public mirror files:
cp -r redtail-public/* /tmp/redtail-public-candidate/
```

This overlays the documentation, src/, test-vectors/, examples/, .github/, and config files onto whatever the preparation script extracted.

### Step 4: Read the report

```bash
cat /tmp/redtail-public-candidate/PUBLIC_RELEASE_REPORT.md
```

Address every item in the "Skipped — secret scan hit" section.
For each skipped file, decide: is the hit a true positive (real secret — do not include) or a false positive (safe — manually copy after review)?

## Phase 2 — Validate

### Step 5: Run the validation script

```bash
python3 scripts/validate-public-release.py \
    --dst /tmp/redtail-public-candidate
```

Resolve every failure. Re-run until all checks pass.

### Step 6: Run gitleaks

```bash
gitleaks detect --no-git -v --source /tmp/redtail-public-candidate
```

Resolve every finding. A clean run shows "no leaks found."

### Step 7: Run trufflehog

```bash
trufflehog filesystem --no-update --only-verified /tmp/redtail-public-candidate
```

Resolve every verified finding.

### Step 8: Install and test

```bash
cd /tmp/redtail-public-candidate
npm install
npm run typecheck
npm test
```

All type checks and tests must pass. If they fail, fix the issue in the candidate directory and re-run validation.

## Phase 3 — Manual review

### Step 9: Read every file

This is not optional. The candidate has ~40 files; it takes 30–45 minutes.
You are looking for:

- Real names, email addresses, or customer data.
- Polish-language operational notes.
- References to internal systems, URLs, or databases.
- Billing, invoicing, Stripe, KSeF, VAT references.
- Anything that feels private or off-register for a public standards-track repository.

### Step 10: Confirm specific files

- [ ] `LICENSE` is the unmodified Apache-2.0 text with correct copyright year.
- [ ] `README.md` opens with "Early public preview" status banner.
- [ ] `SECURITY.md` has a working contact email (not a placeholder).
- [ ] `prisma/schema.prisma` contains no billing, invoicing, admin, or auth models.
- [ ] `package.json` contains no private registry URLs or internal package references.

### Step 11: Dependency license check

```bash
cd /tmp/redtail-public-candidate
npx license-checker --summary
```

Confirm all dependencies are permissive (MIT, Apache-2.0, ISC, BSD).
Flag any GPL, AGPL, SSPL, or unknown licenses.

## Phase 4 — Publish

### Step 12: Initialize git

```bash
cd /tmp/redtail-public-candidate
git init
git add -A
git commit -m "chore: public preview release v0.1.0-preview"
git tag v0.1.0-preview
```

### Step 13: Create a PRIVATE GitHub repository

Create the repository on GitHub as **private** first.
Do not create it as public.

```bash
# Using GitHub CLI:
gh repo create dopebang/redtail-public --private --source . --push
```

Or create via the GitHub web UI and push:

```bash
git remote add origin git@github.com:dopebang/redtail-public.git
git push -u origin main
git push --tags
```

### Step 14: Review in the GitHub UI

- Browse the file tree. Click into every directory.
- Use GitHub code search: search for `secret`, `key`, `token`, `password`, `private`, `sk_`, `whsec_`.
- Check the repository's Security tab — enable secret scanning, Dependabot alerts, and dependency review.
- Check the Actions tab — confirm the CI workflow is visible.

### Step 15: Make public

Only after completing step 14:

- Go to Settings → Danger Zone → Change visibility → Make public.
- Confirm.

### Step 16: Post-publication checks

Wait 24 hours, then:

```bash
# Clone the public repo fresh.
git clone https://github.com/dopebang/redtail-public.git /tmp/redtail-public-verify
cd /tmp/redtail-public-verify
npm install && npm test

# Re-run secret scanners on the public clone.
gitleaks detect -v --source /tmp/redtail-public-verify
trufflehog git https://github.com/dopebang/redtail-public.git --no-update
```

### Step 17: Configure repository settings

- [ ] Enable branch protection on `main` (require PR reviews if/when contributors arrive).
- [ ] Add repository topics: `verification`, `provenance`, `scitt`, `cose`, `standards`, `open-source`, `physical-assets`, `blockchain-anchoring`.
- [ ] Set repository description: "Open-source verification layer for physical assets — standards-focused implementation testbed (IETF SCITT/COSE/HTTP-Sig)."
- [ ] Add issue labels: `bug`, `standards`, `interop`, `test-vector`, `documentation`, `security`.
- [ ] Create a GitHub Release for `v0.1.0-preview` with release notes.

### Step 18: Release notes template

```markdown
## v0.1.0-preview — Early Public Preview

Initial public mirror of the Redtail verification core.

This is a standards-focused implementation testbed, not a production release.

### What's included

- Core data model (records, events, media, categories).
- RDTL calldata format v1 specification and encoder/decoder.
- Canonical hashing (SHA-256 over metadata + media).
- Headless verifier module.
- Test vectors (valid and invalid).
- Documentation: architecture, threat model, standards map, verification flow,
  protocol notes, interoperability, status and scope, glossary.
- Sovereign Tech Standards positioning document.

### What's not included

- Production application code (auth, billing, admin, dashboard).
- On-chain contract source (deferred to a future release).
- COSE_Sign1, HTTP Message Signatures, SCITT alignment (roadmap items).

### Status

Early public preview. See [Status and Scope](docs/status-and-scope.md).
```
