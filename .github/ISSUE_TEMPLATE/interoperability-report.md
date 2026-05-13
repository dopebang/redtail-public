---
name: Interoperability report
about: Report results of testing Redtail's formats against another implementation.
labels: interop
---

**Implementations compared**
- Implementation A: (name, version, language)
- Implementation B: (name, version, language)

**What was tested**
Which formats or flows? (e.g., calldata encoding/decoding, canonical hash computation, verification flow)

**Test vectors used**
Which test vectors from `test-vectors/` or custom inputs?

**Results**

| Test vector | Implementation A | Implementation B | Match? |
|-------------|-----------------|-----------------|--------|
| ... | ... | ... | ... |

**Divergences**
For any mismatches, describe the divergent output and likely cause.

**Assessment**
Is the divergence a bug, an ambiguity in the specification, or a legitimate interpretation difference?
