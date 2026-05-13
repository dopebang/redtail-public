# On-Chain Format

## Overview

Redtail anchors integrity proofs on Base L2 as transaction calldata.
This document specifies the calldata format.

## Transaction structure

Every anchoring transaction is a **self-send** on Base L2:

- **From:** the notary wallet address.
- **To:** the notary wallet address (same as `from`).
- **Value:** 0 ETH.
- **Data:** RDTL-formatted calldata (see below).

The self-send pattern has zero token transfer cost (only gas for calldata).
The calldata is permanently stored on-chain and can be read by any party.

## RDTL calldata format v1

```
Offset  Length  Field
------  ------  -----
0       4       Magic: 0x5244544C (ASCII "RDTL")
4       1       Version: 0x01
5       32      SHA-256 hash
------  ------
Total:  37 bytes
```

### Magic bytes

`0x52` `0x44` `0x54` `0x4C` — the ASCII encoding of "RDTL".
These bytes identify the transaction as a Redtail anchor and distinguish it from other self-send transactions or contract calls.

### Version byte

`0x01` for the current format.
Consumers must check the version byte and reject unrecognized versions rather than attempting to parse.

### Hash

32 bytes. The SHA-256 digest of the canonical record content.
See [Protocol Notes](protocol-notes.md) for the hash computation specification.

## Example

Given a SHA-256 hash of `a1b2c3...` (hex), the complete calldata is:

```
0x5244544c01a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8
```

Breakdown:
- `5244544c` — magic
- `01` — version
- `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8` — 32-byte hash (hex)

## Parsing rules

1. If the calldata is shorter than 37 bytes, it is not a valid RDTL anchor.
2. If bytes 0–3 are not `0x5244544C`, it is not a valid RDTL anchor.
3. If byte 4 is not a recognized version, do not attempt to parse the payload. Log the version for forward-compatibility analysis.
4. For version `0x01`, bytes 5–36 are the SHA-256 hash. Any bytes after position 36 should be ignored (reserved for future use).

## Gas cost

On Base L2, the calldata cost is approximately:

- 4 gas per zero byte.
- 16 gas per non-zero byte.

For a 37-byte payload with mostly non-zero bytes, the calldata gas is approximately 37 × 16 = 592 gas, plus the base transaction cost (21,000 gas).
Total: ~21,592 gas per anchor.

At typical Base L2 gas prices (< 0.01 gwei), the cost per anchor is a small fraction of a cent.

## Reserved versions

| Version | Status | Description |
|---------|--------|-------------|
| `0x01` | Current | SHA-256 hash, unsigned. |
| `0x02` | Reserved | COSE_Sign1 envelope (draft, not implemented). |
| `0x03`–`0xFF` | Reserved | Unassigned. |
