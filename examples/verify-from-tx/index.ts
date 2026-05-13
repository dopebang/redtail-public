// SPDX-License-Identifier: Apache-2.0

/**
 * Example: decode RDTL calldata from a Base L2 transaction.
 *
 * Usage: npx tsx index.ts <txHash>
 *
 * Requires: RPC_URL environment variable pointing to a Base L2 JSON-RPC endpoint.
 */

import { decodeCalldata, hexToBytes } from '../../src/format/calldata';

async function main() {
  const txHash = process.argv[2];
  if (!txHash) {
    console.error('Usage: npx tsx index.ts <txHash>');
    process.exit(1);
  }

  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    console.error('Set RPC_URL environment variable (e.g., https://mainnet.base.org)');
    process.exit(1);
  }

  console.log(`Fetching transaction ${txHash} from ${rpcUrl}...`);

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionByHash',
      params: [txHash],
    }),
  });

  const json = await response.json();

  if (!json.result) {
    console.error('Transaction not found.');
    process.exit(1);
  }

  const tx = json.result;
  console.log(`From:  ${tx.from}`);
  console.log(`To:    ${tx.to}`);
  console.log(`Input: ${tx.input}`);

  if (tx.from.toLowerCase() !== tx.to?.toLowerCase()) {
    console.warn('Warning: this is not a self-send transaction.');
  }

  try {
    const calldata = hexToBytes(tx.input);
    const decoded = decodeCalldata(calldata);

    const hashHex = Array.from(decoded.hash)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    console.log(`\nRDTL calldata decoded:`);
    console.log(`  Version: ${decoded.version}`);
    console.log(`  Hash:    ${hashHex}`);
  } catch (err) {
    console.error(`Failed to decode RDTL calldata: ${err}`);
    process.exit(1);
  }
}

main();
