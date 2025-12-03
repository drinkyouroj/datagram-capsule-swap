'use client';

import { useAccount, useReadContract, useWriteContract, useBalance } from 'wagmi';
import { CAPSULE_SWAP_ABI } from '@/lib/abis'; // Needs Admin functions added to ABI
import { useState } from 'react';
import { parseEther, formatEther } from 'viem';

const SWAP_CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

const ADMIN_ABI = [
  ...CAPSULE_SWAP_ABI,
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_maintenance', type: 'bool' }],
    name: 'setMaintenance',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_treasury', type: 'address' }],
    name: 'setTreasury',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: '_percentage', type: 'uint256' }],
    name: 'setPercentage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export default function AdminPage() {
  const { address } = useAccount();
  const { data: owner } = useReadContract({
    abi: ADMIN_ABI,
    address: SWAP_CONTRACT,
    functionName: 'owner',
  });
  
  const { data: balanceData } = useBalance({
    address: SWAP_CONTRACT,
  });

  const { writeContract, isPending } = useWriteContract();
  const [treasury, setTreasury] = useState('');
  const [percentage, setPercentage] = useState('');

  if (address !== owner) {
    return <div className="p-10 text-center">Unauthorized. Connect owner wallet.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="space-y-8">
        {/* Liquidity Section */}
        <div className="bg-white/5 p-6 rounded-xl border border-blue-500/30">
          <h2 className="text-xl font-semibold mb-2">Contract Liquidity</h2>
          <p className="text-gray-400 mb-4">
            Balance: <span className="text-white font-mono text-lg">{balanceData ? formatEther(balanceData.value) : '0'} DGRAM</span>
          </p>
          <button 
            onClick={() => writeContract({ abi: ADMIN_ABI, address: SWAP_CONTRACT, functionName: 'withdraw' })}
            disabled={!balanceData || balanceData.value === 0n || isPending}
            className="w-full bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded font-bold hover:bg-blue-500 transition"
          >
            Withdraw All to Owner
          </button>
        </div>

        <div className="bg-white/5 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Maintenance Mode</h2>
          <div className="flex gap-4">
            <button 
              onClick={() => writeContract({ abi: ADMIN_ABI, address: SWAP_CONTRACT, functionName: 'setMaintenance', args: [true] })}
              className="bg-red-500/20 text-red-500 px-4 py-2 rounded hover:bg-red-500/30"
            >
              Enable Maintenance
            </button>
            <button 
              onClick={() => writeContract({ abi: ADMIN_ABI, address: SWAP_CONTRACT, functionName: 'setMaintenance', args: [false] })}
              className="bg-green-500/20 text-green-500 px-4 py-2 rounded hover:bg-green-500/30"
            >
              Disable Maintenance
            </button>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Update Treasury</h2>
          <div className="flex gap-4">
            <input 
              value={treasury} 
              onChange={e => setTreasury(e.target.value)} 
              placeholder="0x..." 
              className="bg-black border border-white/10 rounded px-4 py-2 flex-1"
            />
            <button 
              onClick={() => writeContract({ abi: ADMIN_ABI, address: SWAP_CONTRACT, functionName: 'setTreasury', args: [treasury as `0x${string}`] })}
              className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-500"
            >
              Update
            </button>
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Payout Percentage</h2>
          <div className="flex gap-4">
            <input 
              value={percentage} 
              onChange={e => setPercentage(e.target.value)} 
              type="number"
              placeholder="25" 
              className="bg-black border border-white/10 rounded px-4 py-2 flex-1"
            />
            <button 
              onClick={() => writeContract({ abi: ADMIN_ABI, address: SWAP_CONTRACT, functionName: 'setPercentage', args: [BigInt(percentage)] })}
              className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-500"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

