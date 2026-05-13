# Status and Scope

## What is ready

These components are implemented, deployed, and functional in the production system.
The public mirror includes the verification-relevant subset.

- **SHA-256 integrity hashing.** Media files are hashed at upload time (client-side and server-side). The canonical metadata + media hash computation is deterministic and reproducible.
- **On-chain anchoring.** Records are anchored on Base L2 using the RDTL calldata format (v1). The `txHash` is returned immediately; confirmation is asynchronous.
- **Append-only event log.** Each record has an ordered event log (`RecordEvent`) covering creation, updates, transfers, inspections, certifications, and custom events. Events can be independently anchored.
- **Content-addressable media.** Each `RecordMedia` entry stores the SHA-256 hash of the file. Integrity can be verified by recomputing the hash from the stored file.
- **Public verification endpoint.** The `/v/{txHash}` endpoint returns record metadata, media references, and anchor details for independent verification.
- **Category-driven data model.** Records are organized by categories with schema-defined fields (`CategoryDefinition`, `FieldDefinition`, `RecordFieldValue`). This is an EAV pattern with type safety.

## What is experimental

These components exist in the codebase but are not hardened, not formally specified, or subject to change.

- **Canonical metadata serialization.** The JSON canonicalization rules are implemented but not formally specified against RFC 8785 (JCS). The current implementation uses a custom sort; migration to JCS is under consideration.
- **Calldata format v1.** The format is stable in the deployed system but has not been reviewed by external parties. The version byte allows evolution.
- **Verification receipt.** The receipt structure is ad-hoc (a JSON object returned by the endpoint). It is not signed, not structured as a SCITT receipt, and not portable.
- **NFC tag integration.** Records can be associated with NFC tags; scanning a tag redirects to the verification endpoint. The NFC binding mechanism is application-specific and not standardized.

## What is not production-ready

- **Notary key management.** The notary private key is stored as an environment variable. There is no HSM, no key rotation, no multi-sig, and no revocation mechanism.
- **Signed statements.** The anchored hash is unsigned. There is no COSE_Sign1, JWS, or other signature envelope. The identity of the issuer is inferred from the transaction sender, not from a cryptographic signature.
- **Response signing.** Verification endpoint responses are not signed (no RFC 9421). Transport security is TLS only.
- **Formal security audit.** The system has not been audited by an independent security firm.
- **Multi-operator deployment.** The system is designed for a single operator. Multi-tenant or federated deployments have not been tested.

## What is out of scope

These items are explicitly outside the scope of this repository and the Redtail verification layer.

- **Physical asset verification.** Redtail verifies that a digital record has not been altered. It does not verify that a physical asset matches the record. That is a different problem (computer vision, physical inspection, chain of custody).
- **Identity verification.** Redtail does not verify the identity of the record creator or the asset owner. It records what the creator asserts; it does not validate those assertions.
- **Token/NFT functionality.** Redtail is not a token platform. The anchoring transaction does not mint, transfer, or burn tokens.
- **Decentralized governance.** There is no DAO, voting mechanism, or decentralized decision-making.
- **Billing, payments, and commercial features.** These exist in the production application but are excluded from this public mirror.
