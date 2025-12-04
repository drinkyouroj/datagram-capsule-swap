import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { config as dotenvConfig } from "dotenv";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.resolve(__dirname, '../.env.local') });

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
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("❌ Error: Supabase credentials missing.");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Removed duplicate __dirname definition
const valuesPath = path.join(__dirname, '../app/capsule_values.json');
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

const SWAPPED_EVENT_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'amount', type: 'uint256' }
    ],
    name: 'Swapped',
    type: 'event'
  }
];

// Clients
const transport = http(RPC_URL);
const client = createPublicClient({ transport });
const account = privateKeyToAccount(DEPLOYER_KEY);
const wallet = createWalletClient({ account, chain: { id: CHAIN_ID, rpcUrls: { default: { http: [RPC_URL] } } }, transport });

console.log("🚀 Listener Bot Started");
console.log(`Watching for transfers to Treasury: ${TREASURY_ADDRESS}`);
console.log(`Watching for Swaps on Contract: ${SWAP_CONTRACT_ADDRESS}`);

// --- Logic 1: Detect Transfers and Payout ---

const processTransfer = async (from, to, tokenId) => {
  if (to.toLowerCase() === TREASURY_ADDRESS.toLowerCase()) {
    console.log(`\n📦 Capsule Received! ID: ${tokenId} | From: ${from}`);
    
    try {
      // 1. Get Value
      let valStr = capsuleValues[tokenId.toString()];
      
      // Retry with padding if not found (e.g. 474... -> 0474...)
      if (!valStr) {
        valStr = capsuleValues[tokenId.toString().padStart(10, '0')];
      }

      if (!valStr) {
        console.log(`❌ Capsule #${tokenId} value not found in list. Skipping.`);
        return;
      }

      const totalValue = parseEther(valStr);
      const payout = (totalValue * 20n) / 100n;
      
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
};

// --- Logic 2: Detect Swaps and Log to Supabase ---

const processSwapLog = async (user, tokenId, amount, transactionHash) => {
  console.log(`\n📝 Recording Swap: ID ${tokenId} | User ${user} | Tx ${transactionHash}`);
  
  try {
    // Check if already exists
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('token_id', tokenId.toString())
      .single();

    if (existing) {
      console.log("ℹ️  Transaction already recorded in DB.");
      return;
    }

    // Insert
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_address: user,
        token_id: tokenId.toString(),
        amount: amount.toString(),
        status: 'success',
        nonce: transactionHash, // Storing TX hash in nonce field for compatibility with existing UI
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error("❌ Database Insert Error:", error.message);
    } else {
      console.log("✅ Database Updated!");
    }
  } catch (err) {
    console.error("❌ DB Error:", err);
  }
};

// --- Startup Poll ---

const pollRecentEvents = async () => {
  try {
    const blockNumber = await client.getBlockNumber();
    console.log(`Checking past blocks from ${blockNumber - 100n} to ${blockNumber}...`);
    
    // 1. Check Transfers (for Payouts)
    const transferLogs = await client.getContractEvents({
      address: CAPSULE_NFT_ADDRESS,
      abi: ERC721_TRANSFER_ABI,
      eventName: 'Transfer',
      fromBlock: blockNumber - 100n,
      toBlock: blockNumber
    });

    for (const log of transferLogs) {
      const { from, to, tokenId } = log.args;
      await processTransfer(from, to, tokenId);
    }

    // 2. Check Swaps (for DB)
    const swapLogs = await client.getContractEvents({
      address: SWAP_CONTRACT_ADDRESS,
      abi: SWAPPED_EVENT_ABI,
      eventName: 'Swapped',
      fromBlock: blockNumber - 100n,
      toBlock: blockNumber
    });

    for (const log of swapLogs) {
      const { user, tokenId, amount } = log.args;
      await processSwapLog(user, tokenId, amount, log.transactionHash);
    }

  } catch (e) {
    console.error("Error polling past events:", e);
  }
};

// Run initial poll
pollRecentEvents();

// --- Start Watchers ---

// 1. Watch Transfers
client.watchContractEvent({
  address: CAPSULE_NFT_ADDRESS,
  abi: ERC721_TRANSFER_ABI,
  eventName: 'Transfer',
  onLogs: async (logs) => {
    for (const log of logs) {
      const { from, to, tokenId } = log.args;
      await processTransfer(from, to, tokenId);
    }
  }
});

// 2. Watch Swaps
client.watchContractEvent({
  address: SWAP_CONTRACT_ADDRESS,
  abi: SWAPPED_EVENT_ABI,
  eventName: 'Swapped',
  onLogs: async (logs) => {
    for (const log of logs) {
      const { user, tokenId, amount } = log.args;
      await processSwapLog(user, tokenId, amount, log.transactionHash);
    }
  }
});


