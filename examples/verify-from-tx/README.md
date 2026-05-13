# Example: Verify from Transaction

This example demonstrates verifying a Redtail record given a transaction hash on Base L2.

## Usage

```bash
# Set your RPC endpoint (public Base L2 RPC or Alchemy/Infura).
export RPC_URL="https://mainnet.base.org"

npx tsx index.ts <txHash>
```

## What it does

1. Fetches the transaction from Base L2 via `eth_getTransactionByHash`.
2. Extracts the calldata from the transaction.
3. Decodes the RDTL calldata format.
4. Prints the anchored hash.

This example does not perform the full verification (recomputation from metadata + media),
because that requires the original record data.
It demonstrates only the calldata extraction and decoding step.

## Note

