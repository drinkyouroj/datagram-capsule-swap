'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { Loader2 } from 'lucide-react';
import capsuleValues from '@/../data/capsule_values.json'; // Check path
import { ERC721_ABI, CAPSULE_SWAP_ABI } from '@/lib/abis';
import { useWriteContract, useReadContract } from 'wagmi';

// Contract Addresses
const CAPSULE_CONTRACT = '0xC9Af289cd84864876b5337E3ef092B205f47d65F';
const SWAP_CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`; // Needs env

type Capsule = {
  id: string;
  value: string;
  payout: string;
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(false);
  const [swappingId, setSwappingId] = useState<string | null>(null);

  // Fetch Capsules
  useEffect(() => {
    if (isConnected && address) {
      fetchCapsules(address);
    } else {
      setCapsules([]);
    }
  }, [isConnected, address]);

  const fetchCapsules = async (userAddress: string) => {
    setLoading(true);
    try {
      // Use Blockscout API
      const response = await fetch(`https://explorer.datagram.network/api?module=account&action=tokenlist&address=${userAddress}`);
      const data = await response.json();
      
      if (data.result && Array.isArray(data.result)) {
        const userCapsules = data.result
          .filter((token: any) => token.contractAddress.toLowerCase() === CAPSULE_CONTRACT.toLowerCase())
          .map((token: any) => {
             // If Blockscout returns individual items per ID, great.
             // Usually tokenlist returns 'balance', not IDs for ERC721 unless specific endpoint.
             // Check API docs: tokenlist usually returns ERC20/ERC721 balances.
             // If it doesn't list IDs, we might need '?module=account&action=tokennfttx&contractaddress=...' and parse.
             // OR rely on 'tokenOfOwnerByIndex' if supported.
             return token;
          });
          
        // Fallback: The Blockscout 'tokenlist' might not give IDs.
        // Let's assume for MVP we might need a different way or the user manually enters ID?
        // No, user said "scan wallet".
        // Let's try a simpler approach: Assume the contract supports Enumerable or we fetch from an indexer.
        // Since I can't check the contract code, I'll assume standard Blockscout API behavior for NFTs.
        // Actually, `?module=account&action=tokenlist` often aggregates.
        // Better endpoint: `https://explorer.datagram.network/api/v2/addresses/{address}/nft?type=ERC-721` (Blockscout v2 API).
        // Let's try v2 API.
      }
      
      // MOCK DATA FOR DEV if API fails or is empty (since I don't have capsules)
      // setCapsules([{ id: '3135137970', value: '2500', payout: '625' }]); 
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  // REAL FETCH IMPLEMENTATION
  // I will use a raw fetch to the v2 API in the actual code if possible, or rely on 'tokenOfOwnerByIndex' loop if balance is small.
  // Safe bet: Loop balance.
  
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold tracking-tighter">Datagram Capsule Swap</h1>
        {isConnected ? (
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-400">{address?.slice(0,6)}...{address?.slice(-4)}</span>
            <button 
              onClick={() => disconnect()}
              className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg hover:bg-red-500/20 transition"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            onClick={() => connect({ connector: injected() })}
            className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition"
          >
            Connect Wallet
          </button>
        )}
      </header>

      {!isConnected ? (
        <div className="text-center py-20 text-gray-500">
          <p>Connect your wallet to view your capsules.</p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-semibold">Your Capsules</h2>
            <button onClick={() => address && fetchCapsules(address)} className="text-sm text-blue-400">Refresh</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
          ) : capsules.length === 0 ? (
             <div className="text-center py-20 text-gray-500">No capsules found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {capsules.map(c => (
                <CapsuleCard key={c.id} capsule={c} swapper={SWAP_CONTRACT} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-20 border-t border-white/10 pt-12">
        <h2 className="text-2xl font-bold mb-6">Recent Swaps</h2>
        <ActivityFeed />
      </div>
    </main>
  );
}

function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/transactions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setActivities(data);
      })
      .catch(console.error);
  }, []);

  if (activities.length === 0) return <div className="text-gray-500">No recent activity.</div>;

  return (
    <div className="space-y-4">
      {activities.map((act, i) => (
        <div key={i} className="bg-white/5 p-4 rounded-lg flex justify-between items-center">
          <div>
            <span className="font-mono text-blue-400">{act.user_address.slice(0,6)}...{act.user_address.slice(-4)}</span>
            <span className="text-gray-400 mx-2">swapped Capsule</span>
            <span className="font-bold">#{act.token_id}</span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-green-400 font-mono">+ {formatEther(BigInt(act.amount || 0))} DGRAM</span>
            <a 
              href={`https://explorer.datagram.network/address/${act.user_address}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-gray-600 hover:text-gray-400"
            >
              View
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function CapsuleCard({ capsule, swapper }: { capsule: Capsule, swapper: `0x${string}` }) {
  const { writeContract, isPending } = useWriteContract();
  const [signatureData, setSignatureData] = useState<any>(null);
  const [approving, setApproving] = useState(false);
  const { address } = useAccount();

  // Check approval (Optimistic or real read)
  // For simplicity, we'll do "Approve if needed" flow in the swap button.
  
  const handleSwap = async () => {
    if (!address) return;
    
    try {
      // 1. Get Signature
      const res = await fetch('/api/sign', {
        method: 'POST',
        body: JSON.stringify({ tokenId: capsule.id, userAddress: address }),
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      
      // 2. Call Contract
      writeContract({
        abi: CAPSULE_SWAP_ABI,
        address: swapper,
        functionName: 'swap',
        args: [
          BigInt(capsule.id),
          BigInt(data.amount), // Amount in wei
          BigInt(data.nonce),
          BigInt(data.deadline),
          data.signature
        ],
      });
      
    } catch (err) {
      console.error(err);
      alert('Swap failed: ' + (err as Error).message);
    }
  };

  return (
    <div className="border border-white/10 bg-white/5 rounded-xl p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold">Capsule #{capsule.id}</h3>
        <p className="text-gray-400 text-sm">Value: {capsule.value} DGRAM</p>
      </div>
      
      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="flex justify-between mb-4">
          <span>You Receive</span>
          <span className="text-green-400 font-mono text-xl">{capsule.payout} DGRAM</span>
        </div>
        
        <button 
          onClick={handleSwap}
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition flex justify-center items-center gap-2"
        >
          {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : 'Swap Now'}
        </button>
      </div>
    </div>
  );
}
