# Examples

This directory contains usage examples for the Redtail verification modules.

## Available examples

### `verify-from-tx/`

Demonstrates how to verify a Redtail record given a transaction hash.
Takes a `txHash`, fetches the calldata from Base L2, and runs the verifier.

**Prerequisites:** An Ethereum JSON-RPC endpoint for Base L2 (e.g., a public RPC or Alchemy/Infura).

### `generate-test-vector/`

Demonstrates how to create a new test vector: takes metadata and media files, computes the canonical hash and calldata, and outputs the `input.json` and `expected.json` files.

## Running examples

Each example directory contains its own `README.md` with instructions.

General pattern:

```bash
cd examples/<example-name>
npx tsx index.ts
```

These examples use `tsx` for TypeScript execution.
Install it globally (`npm i -g tsx`) or use `npx`.

## Notes

- Examples are illustrative, not production code.
- Examples do not interact with production systems or real wallets.
- Examples use test data and testnet references where applicable.
