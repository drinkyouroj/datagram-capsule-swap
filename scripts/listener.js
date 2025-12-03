import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { config as dotenvConfig } from "dotenv";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenvConfig({ path: ".env.local" });

// Config
const CHAIN_ID = 968;
const RPC_URL = "https://mainnet.datagram.network/rpc";
const CAPSULE_NFT_ADDRESS = "0xC9Af289cd84864876b5337E3ef092B205f47d65F";
const SWAP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY; // Using deployer/owner key to payout

// Validate keys safely
if (!DEPLOYER_KEY) {
  console.error("❌ Error: DEPLOYER_PRIVATE_KEY is undefined. Check your .env.local file.");
  process.exit(1);
}
if (!DEPLOYER_KEY.startsWith("0x")) {
  console.error("❌ Error: DEPLOYER_PRIVATE_KEY must start with '0x'.");
  process.exit(1);
}
if (!SWAP_CONTRACT_ADDRESS) {
  console.error("❌ Error: NEXT_PUBLIC_CONTRACT_ADDRESS is undefined.");
  process.exit(1);
}
if (!TREASURY_ADDRESS) {
  console.error("❌ Error: TREASURY_ADDRESS is undefined.");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const valuesPath = path.join(__dirname, '../data/capsule_values.json');
const capsuleValues = JSON.parse(fs.readFileSync(valuesPath, 'utf8'));

// ABI Minimal
const ERC721_TRANSFER_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  }
];

const SWAP_PAYOUT_ABI = [
  {
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'tokenId', type: 'uint256' }
    ],
    name: 'payoutDirect',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

// Clients
const transport = http(RPC_URL);
const client = createPublicClient({ transport });
const account = privateKeyToAccount(DEPLOYER_KEY);
const wallet = createWalletClient({ account, chain: { id: CHAIN_ID, rpcUrls: { default: { http: [RPC_URL] } } }, transport });

console.log("🚀 Listener Bot Started");
console.log(`Watching for transfers to Treasury: ${TREASURY_ADDRESS}`);
console.log(`Swap Contract: ${SWAP_CONTRACT_ADDRESS}`);

client.watchContractEvent({
  address: CAPSULE_NFT_ADDRESS,
  abi: ERC721_TRANSFER_ABI,
  eventName: 'Transfer',
  onLogs: async (logs) => {
    for (const log of logs) {
      const { from, to, tokenId } = log.args;
      
      if (to.toLowerCase() === TREASURY_ADDRESS.toLowerCase()) {
        console.log(`\n📦 Capsule Received! ID: ${tokenId} | From: ${from}`);
        
        try {
          // 1. Get Value
          const valStr = capsuleValues[tokenId.toString()];
          if (!valStr) {
            console.log(`❌ Capsule #${tokenId} value not found in list. Skipping.`);
            continue;
          }

          const totalValue = parseEther(valStr);
          const payout = (totalValue * 25n) / 100n;
          
          console.log(`💰 Value: ${valStr} | Payout: ${formatEther(payout)} DGRAM`);

          // 2. Execute Payout
          console.log("⏳ Sending Payout Transaction...");
          const hash = await wallet.writeContract({
            address: SWAP_CONTRACT_ADDRESS,
            abi: SWAP_PAYOUT_ABI,
            functionName: 'payoutDirect',
            args: [from, payout, tokenId]
          });

          console.log(`✅ Payout Sent! Tx: ${hash}`);
          
        } catch (err) {
          if (err.message.includes("Capsule already processed")) {
            console.log("⚠️ Capsule already paid out.");
          } else {
            console.error("❌ Payout Failed:", err);
          }
        }
      }
    }
  }
});

