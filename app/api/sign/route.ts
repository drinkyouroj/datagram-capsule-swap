import { NextResponse } from 'next/server';
import { createPublicClient, http, createWalletClient, parseEther, keccak256, encodePacked, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains'; // We'll override this for Datagram
import capsuleValuesData from '@/app/capsule_values.json';
const capsuleValues = capsuleValuesData as Record<string, string>;
import { supabase } from '@/lib/supabase';

const DATAGRAM_CHAIN = {
  id: 968,
  name: 'Datagram',
  network: 'datagram',
  nativeCurrency: {
    decimals: 18,
    name: 'Datagram',
    symbol: 'DGRAM',
  },
  rpcUrls: {
    public: { http: ['https://mainnet.datagram.network/rpc'] },
    default: { http: ['https://mainnet.datagram.network/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Datagram Explorer', url: 'https://explorer.datagram.network' },
  },
} as const;

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY as `0x${string}`;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export async function POST(request: Request) {
  try {
    const { tokenId, userAddress } = await request.json();

    if (!tokenId || !userAddress) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Validate ID and Get Value
    // The JSON keys are strings.
    const valueStr = (capsuleValues as Record<string, string>)[tokenId.toString()];
    
    if (!valueStr) {
      return NextResponse.json({ error: 'Invalid Capsule ID' }, { status: 400 });
    }

    const totalValue = parseEther(valueStr); // Assuming values in JSON are full tokens?
    // Wait, the JSON values like "2500" might be raw units or formatted?
    // "2500" for a crypto usually means 2500 tokens if formatted, or 2500 wei?
    // The site says "DGRAM $1,807". If value is "2500", it's likely 2500 DGRAM.
    // So parseEther("2500") is correct.

    const payoutAmount = (totalValue * 25n) / 100n; // 25%

    // 2. Generate Signature
    const account = privateKeyToAccount(ADMIN_PRIVATE_KEY);
    const nonce = BigInt(Date.now()); // Simple timestamp nonce for now
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

    // Message: tokenId, amount, user, nonce, deadline, contract
    // keccak256(abi.encodePacked(tokenId, amount, msg.sender, nonce, deadline, address(this)))
    
    // Viem encoding:
    // We need to replicate the Solidity `abi.encodePacked`.
    // Types: uint256, uint256, address, uint256, uint256, address
    
    // IMPORTANT: encodePacked matches Solidity's tight packing.
    // For numbers, we typically need to be careful about size. 
    // But Solidity uint256 takes 32 bytes in regular encode, but packed is just the bytes.
    // Actually, standard is `keccak256(abi.encodePacked(...))`.
    
    // Let's verify the Solidity part:
    // bytes32 message = keccak256(abi.encodePacked(tokenId, amount, msg.sender, nonce, deadline, address(this)));
    
    // In JS/Viem:
    /*
      encodePacked(
        ['uint256', 'uint256', 'address', 'uint256', 'uint256', 'address'],
        [tokenId, amount, user, nonce, deadline, contract]
      )
    */

    const signature = await account.signMessage({
      message: {
        raw: keccak256(
          encodePacked(
            ['uint256', 'uint256', 'address', 'uint256', 'uint256', 'address'],
            [BigInt(tokenId), payoutAmount, userAddress, nonce, deadline, CONTRACT_ADDRESS]
          )
        )
      }
    });

    // 3. Log to Supabase (Pending)
    await supabase.from('transactions').insert({
      user_address: userAddress,
      token_id: tokenId,
      amount: payoutAmount.toString(),
      status: 'pending',
      nonce: nonce.toString(),
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      amount: payoutAmount.toString(),
      signature,
      nonce: nonce.toString(),
      deadline: deadline.toString()
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

