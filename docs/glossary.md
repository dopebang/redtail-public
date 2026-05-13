# Glossary

**Anchor.** The on-chain transaction that permanently stores a record's integrity hash. The `txHash` of the anchoring transaction is the permanent identifier.

**Base L2.** An Ethereum Layer 2 rollup (Optimism-based) where Redtail anchors transactions. Chain ID: `8453` (mainnet), `84532` (Sepolia testnet).

**Calldata.** The data field of an Ethereum transaction. Redtail uses calldata to store the RDTL-formatted integrity hash.

**Canonical metadata.** The deterministic JSON serialization of a record's structured fields, used as input to the hash computation. Keys are sorted lexicographically; null values are omitted.

**COSE (CBOR Object Signing and Encryption).** An IETF standard (RFC 9052) for signing and encrypting data using CBOR. Redtail's roadmap includes wrapping integrity hashes in COSE_Sign1 envelopes.

**COSE_Sign1.** A COSE structure for a single-signer signature. The planned envelope format for signed anchors.

**Event (RecordEvent).** An append-only log entry representing something that happened to a record's underlying asset: creation, transfer, inspection, etc.

**Hash.** In this project, always SHA-256 unless otherwise specified. The hash is the 32-byte digest used for integrity verification.

**HTTP Message Signatures.** An IETF standard (RFC 9421) for signing HTTP requests and responses. Planned for the verification endpoint.

**Magic bytes.** The 4-byte prefix `0x5244544C` (ASCII "RDTL") that identifies a transaction as a Redtail anchor.

**Notary.** The operator-controlled wallet that sends anchoring transactions. Currently a single Ethereum EOA (externally owned account).

**Receipt.** The verification output that associates a record with its on-chain anchor. Currently ad-hoc JSON; planned to be structured as a SCITT receipt.

**Record.** The central entity in Redtail: a named digital representation of a physical asset, with metadata, media, and an event log.

**SCITT (Supply Chain Integrity, Transparency, and Trust).** An IETF working group and architecture (RFC 9711) for transparent, verifiable supply chain claims. Redtail's anchoring model is adjacent to SCITT's transparency service concept.

**Self-send.** A transaction where the sender and recipient are the same address. Used by Redtail to store calldata on-chain without transferring tokens.

**Test vector.** A known input/output pair used to verify that an implementation produces the correct result. Published in `test-vectors/`.

**Verification.** The process of confirming that a record's current metadata and media produce the same hash as the one anchored on-chain.

**Verification endpoint.** The public HTTP endpoint (`/v/{txHash}`) that serves record data for independent verification.
